// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {MathUtils} from "../math/MathUtils.sol";
import {WadRayMath} from "../math/WadRayMath.sol";
import {PercentageMath} from "../math/PercentageMath.sol";
import {Errors} from "../utils/Errors.sol";
import {DataTypes} from "../utils/DataTypes.sol";

/**
 * @title ReputationLogic library
 * @author Sumit Mahajan
 * @notice Implements the logic to calculate and maintain credit score
 * To understand the approach and algorithms, see https://docs.google.com/document/d/1NxCas4gfWV6V7uHOEGUTJPpEtPOJwV_AZUbYfWxpP_U/edit?usp=sharing
 */
library ReputationLogic {
    using SafeMath for uint256;
    using WadRayMath for uint256;
    using PercentageMath for uint256;
    using ReputationLogic for DataTypes.UserReputation;

    uint256 constant MILLISECONDS_IN_A_WEEK = 86400000;
    uint256 constant OPTIMAL_CREDIT_UTILIZATION_PERCENT = 8500;

    /**
     * @dev Returns real time reputation class and credit score of a user
     * @param userReputation The user reputation object
     * @param classesData The configuration data for all classes
     * @return UserClass Real time user class
     * @return score Real time credit score
     **/
    function getReputationClass(
        DataTypes.UserReputation storage userReputation,
        mapping(uint256 => DataTypes.ClassData) storage classesData
    ) external view returns (DataTypes.UserClass, uint256 score) {
        score = userReputation.cumulateReputation(classesData);

        if (score <= 600 ether) {
            return (DataTypes.UserClass.Bronze, score);
        } else if (score <= 700 ether) {
            return (DataTypes.UserClass.Silver, score);
        } else if (score <= 800 ether) {
            return (DataTypes.UserClass.Gold, score);
        } else {
            return (DataTypes.UserClass.Platinum, score);
        }
    }

    /**
     * @dev Returns configuration parameters of a user class depending on the score
     * @param classesData The configuration data for all classes
     * @param score The credit score
     * @return ClassData The configuration data for the class for score
     **/
    function getClassData(
        mapping(uint256 => DataTypes.ClassData) storage classesData,
        uint256 score
    ) public view returns (DataTypes.ClassData memory) {
        if (score <= 600 ether) {
            return classesData[3];
        } else if (score <= 700 ether) {
            return classesData[2];
        } else if (score <= 800 ether) {
            return classesData[1];
        } else {
            return classesData[0];
        }
    }

    /**
     * If a user borrows 85% of its allowed borrowing capacity, it is considered optimal and results in highest score increment
     * @dev Calculates the BorrowPercentFactor from given user's current loan
     * @param percentageBorrowed The percentage of amount borrowed wrt max borrow capacity
     * @return BorrowPercentFactor The BorrowPercentFactor is a percentage value. Range: 0 - 10000
     **/
    function getBorrowPercentFactor(uint256 percentageBorrowed)
        internal
        pure
        returns (uint256)
    {
        // OPTIMAL_CREDIT_UTILIZATION_PERCENT == 8500
        if (percentageBorrowed > OPTIMAL_CREDIT_UTILIZATION_PERCENT) {
            // Two point equation between (OPTIMAL_CREDIT_UTILIZATION_PERCENT,10000) and (10000,4000)
            if (percentageBorrowed > 11000) {
                return 4000;
            }
            return (44000 - 4 * percentageBorrowed);
        } else {
            // Two point equation between (OPTIMAL_CREDIT_UTILIZATION_PERCENT,10000) and (0,0)
            return
                (percentageBorrowed * 10000) /
                uint256(OPTIMAL_CREDIT_UTILIZATION_PERCENT);
        }
    }

    /**
     * @dev Logic for adding the accured reputation to score
     * @param userReputation The user reputation object
     * @param classesData The configuration data for all classes
     * @return score The current, real time credit score of user
     **/
    function cumulateReputation(
        DataTypes.UserReputation storage userReputation,
        mapping(uint256 => DataTypes.ClassData) storage classesData
    ) internal view returns (uint256) {
        if (block.timestamp == userReputation.lastUpdateTimestamp) {
            return userReputation.lastScore;
        }

        uint256 score = userReputation.lastScore;
        uint256 timeDiff;
        DataTypes.ClassData memory userClassData;

        if (userReputation.lastUpdateTimestamp == 0) {
            timeDiff = 0;
        } else {
            timeDiff = block.timestamp - userReputation.lastUpdateTimestamp;
        }
        uint256 nWeeks = timeDiff / uint256(MILLISECONDS_IN_A_WEEK);
        userClassData = getClassData(classesData, score);
        uint256 classIdealTimeSpan = userClassData.idealTimeSpan;
        uint256 classScoreRange = userClassData.scoreRange;

        if (nWeeks == 0) {
            // If time difference from last tx is less than a week, calculate accured score by formula,
            // Accured score = BorrowPercentFactor % of (timeDiff/classIdealTimeSpan) * classScoreRange
            score +=
                timeDiff.wadDiv(classIdealTimeSpan).percentMul(
                    getBorrowPercentFactor(
                        userReputation.lastPercentageBorrowed
                    )
                ) *
                classScoreRange *
                1000;
        } else {
            // Otherwise use the same formula on per week timeframe, to take into account class change in between
            uint256 remainder = timeDiff - nWeeks * MILLISECONDS_IN_A_WEEK;
            for (uint16 i = 0; i < nWeeks; i++) {
                score +=
                    MILLISECONDS_IN_A_WEEK
                        .wadDiv(classIdealTimeSpan)
                        .percentMul(
                            getBorrowPercentFactor(
                                userReputation.lastPercentageBorrowed
                            )
                        ) *
                    classScoreRange *
                    1000;

                userClassData = getClassData(classesData, score);
                classIdealTimeSpan = userClassData.idealTimeSpan;
                classScoreRange = userClassData.scoreRange;
            }
            score +=
                remainder.wadDiv(classIdealTimeSpan).percentMul(
                    getBorrowPercentFactor(
                        userReputation.lastPercentageBorrowed
                    )
                ) *
                classScoreRange *
                1000;
        }

        // Upper limit for reputation score is 900
        if (score > 900 ether) {
            score = 900 ether;
        }

        return score;
    }

    /**
     * @dev Adds the accured reputation to stored score before every transaction
     * @param userReputation The user reputation object
     * @param classesData The configuration data for all classes
     **/
    function addReputation(
        DataTypes.UserReputation storage userReputation,
        mapping(uint256 => DataTypes.ClassData) storage classesData
    ) internal {
        if (userReputation.lastScore == 0) {
            userReputation.lastScore = 300 ether;
        }

        userReputation.lastScore = userReputation.cumulateReputation(
            classesData
        );
        userReputation.lastUpdateTimestamp = block.timestamp;
    }

    /**
     * @dev Drops the reputation score in case of liquidation
     * @param userReputation The user reputation object
     * @param classesData The configuration data for all classes
     **/
    function dropReputation(
        DataTypes.UserReputation storage userReputation,
        mapping(uint256 => DataTypes.ClassData) storage classesData
    ) internal {
        DataTypes.ClassData memory userClassData = getClassData(
            classesData,
            userReputation.lastScore
        );

        userReputation.lastScore.sub(userClassData.dropFactor);
        userReputation.lastUpdateTimestamp = block.timestamp;

        // Lower limit for reputation score is 300
        if (userReputation.lastScore < 300 ether) {
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
        if (totalDebtInETH == 0 || totalCollateralInETH == 0) {
            userReputation.lastPercentageBorrowed = 0;
        } else {
            userReputation.lastPercentageBorrowed =
                (
                    (totalDebtInETH.wadDiv(totalCollateralInETH)).wadDiv(
                        userAllowedLTV * 1e14
                    )
                ) /
                uint256(1e14);
        }
    }
}
