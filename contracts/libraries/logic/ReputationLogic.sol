// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {ReserveConfiguration} from "../configuration/ReserveConfiguration.sol";
import {MathUtils} from "../math/MathUtils.sol";
import {WadRayMath} from "../math/WadRayMath.sol";
import {PercentageMath} from "../math/PercentageMath.sol";
import {Errors} from "../utils/Errors.sol";
import {DataTypes} from "../utils/DataTypes.sol";

/**
 * @title ReserveLogic library
 * @author Aave
 * @notice Implements the logic to update the reserves state
 */
library ReserveLogic {
    using SafeMath for uint256;
    using WadRayMath for uint256;
    using PercentageMath for uint256;
    using ReserveLogic for DataTypes.ReserveData;
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;

    uint256 constant MILLISECONDS_PER_MONTH = 2629800000;

    /**
     * @dev Returns real time reputation class of a user
     * @param userReputation The user reputation object
     * @return UserClass
     **/
    function getReputationClass(DataTypes.UserReputation storage userReputation) external view returns(uint) {
        uint256 score = userReputation.cumulateReputation();

        if(score <= 600 ether) {
            return DataTypes.UserClass.Bronze;
        } else if(score <= 700 ether) {
            return DataTypes.UserClass.Silver;
        } else if(score <= 800 ether) {
            return DataTypes.UserClass.Gold;
        } else {
            return DataTypes.UserClass.Diamond;
        }
    }

    /**
     * Returns the time in milliseconds needed for a perfect borrower to move through the given class bottom up
     * @dev Gets the reputationFactor for given user class
     * @param userReputation The user reputation object
     * @return reputationFactor 
     **/
    function getReputationFactor(DataTypes.UserReputation storage userReputation) internal view returns(uint) {
        if(userReputation.lastScore <= 600 ether) {
            // 3 months to millisconds
            return 7889238000;
        } else if(userReputation.lastScore <= 700 ether) {
            // 9 months to millisconds
            return 23667714000;
        } else if(userReputation.lastScore <= 800 ether) {
            // 1 year to millisconds
            return 31556952000;
        } else {
            // 10 years to millisconds
            return 315569520000;
        }
    }

    /**
     * If a user borrows 85% of its allowed borrowing capacity, it is considered optimal and results in highest score increment
     * @dev Calculates the BorrowPercentFactor from given user's current loan
     * @param percentageBorrowed The percentage of amount borrowed wrt max borrow capacity
     * @return BorrowPercentFactor 
     **/
    function getBorrowPercentFactor(uint256 percentageBorrowed) internal view returns(uint) {
        if(percentageBorrowed > 85 ether) {
            // Two point equation between (85,1) and (100,0.4)
            return (4.4 ether - 4 * percentageBorrowed / uint(100));
        } else {
            return percentageBorrowed.wadDiv(85 ether);
        }
    }

    /**
     * @dev Logic for adding the accured reputation to score
     * @param userReputation The user reputation object
     **/
    function cumulateReputation(DataTypes.UserReputation storage userReputation) external view returns(uint) {
        uint256 score = userReputation.lastScore;

        uint256 timeDiff = block.timestamp - userReputation.lastUpdateTimestamp;
        uint16 nMonths = timeDiff / uint256(MILLISECONDS_PER_MONTH);
        uint256 reputationFactor = userReputation.getReputationFactor();

        if(nMonths == 0) {
            score += getBorrowPercentFactor(userReputation.lastPercentageBorrowed).wadMul(
                (timeDiff * 1e7).wadDiv(reputationFactor * 1e7)
            );
        } else {
            uint256 remainder = timeDiff - nMonths * MILLISECONDS_PER_MONTH;
            for(uint16 i = 0; i < nMonths; i++) {
                score += getBorrowPercentFactor(userReputation.lastPercentageBorrowed).wadMul(
                    (MILLISECONDS_PER_MONTH * 1e7).wadDiv(reputationFactor * 1e7)
                );
                reputationFactor = userReputation.getReputationFactor();
            }
            score += getBorrowPercentFactor(userReputation.lastPercentageBorrowed).wadMul(
                (remainder * 1e7).wadDiv(reputationFactor * 1e7)
            );
        }

        // Upper limit for reputation score is 900
        if(score > 900 ether) {
            score = 900 ether;
        }

        return score;
    }

    /**
     * @dev Adds the accured reputation to score before every transaction
     * @param userReputation The user reputation object
     **/
    function addReputation(DataTypes.UserReputation storage userReputation) internal {
        userReputation.lastScore = userReputation.cumulateReputation();
    }

    /**
     * @dev Drops the reputation score in case of liquidation
     * @param userReputation The user reputation object
     **/
    function dropReputation(DataTypes.UserReputation storage userReputation) internal {
        if(userReputation.lastScore <= 600 ether) {
            userReputation.lastScore.sub(50 ether)
        } else if(userReputation.lastScore <= 700 ether) {
            userReputation.lastScore.sub(100 ether)
        } else if(userReputation.lastScore <= 800 ether) {
            userReputation.lastScore.sub(150 ether)
        } else {
            userReputation.lastScore.sub(200 ether)
        }

        // Lower limit for reputation score is 300
        if(userReputation.lastScore < 300 ether) {
            userReputation.lastScore = 300 ether;
        }
    }

    /**
     * @dev Sets the percentage of borrowed amount wrt borrowing capacity after every transaction of user
     * @param userReputation The user reputation object
     * @param totalCollateralInETH The user's total collateral
     * @param totalDebtInETH The user's total debt
     * @param userAllowedLTV The user's personalized LTV decided using credit score
     **/
    function setCurrentBorrowPercent(
        DataTypes.UserReputation storage userReputation,
        uint256 totalCollateralInETH,
        uint256 totalDebtInETH,
        uint256 userAllowedLTV
    ) internal {
        userReputation.lastPercentageBorrowed = ((totalDebtInETH.wadDiv(totalCollateralInETH))
        .wadDiv(userAllowedLTV * 1e14)) / uint256(1e14);
    }
}
