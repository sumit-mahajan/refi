import Box from "../components/Box";
import "../styles/docs_page.scss"

const DocsPage = () => {
    return (
        <main className="docs-page">
            <h1>Docs</h1>
            <Box height={20} />
            <h2>Introduction</h2>
            <Box height={10} />
            <p>Refi, (Reputation + Finance) is a variable rate lending and borrowing protocol that
                maintains a credit score for its users and provides benefits to them accordingly. It takes its
                core functionality from AAVE v2.
            </p>

            <Box height={20} />
            <h2>Terminologies</h2>
            <Box height={10} />
            <p>Few of the core Terminologies used in Refi are explained below</p>
            <Box height={10} />
            <ul>
                <li><strong>Collateral</strong> - The collateral is basically a security deposit,
                    which the protocol can claim if you fail to repay the loan. Loans in Refi are over-collateralized
                    i.e. you have to deposit more assets than you can borrow. Anything you deposit on the protocol
                    is automatically used as collateral to provide you additional borrowing capacity</li>
                <Box height={5} />
                <li><strong>LTV</strong> - LTV or Loan To Value ratio is the ratio of debt amount to the value of collateral deposited.
                    The LTV for individual asset is the percentage value of total collateral, that can be borrowed
                    in the corresponding asset.
                </li>
                <Box height={5} />
                <li><strong>Liquidation Threshold</strong> - Due to market conditions, the ETH equivalent value
                    of the assets you borrowed and deposited will change. Liquidation Threshold is the
                    maximum ratio of borrowed ETH value to deposited ETH value, beyond which your loan is considered
                    as a "Default" and can be liquidated</li>
                <Box height={5} />
                <li><strong>Health Factor</strong> - Health factor is the ratio of maximum value allowed to borrow
                    to the value actually borrowed.</li>
                <Box height={5} />
                <li><strong>Liquidation</strong> - In the event of a negative price fluctuation of the
                    debt asset (i.e. Health Factor falls below 1), a loan can be liquidated.
                    Anyone can repay the debt and claim the collateral + extra bonus of the defaulter.</li>
                <li><strong>Liquidation Penalty</strong> - When a liquidator liquidates a debt of a borrower,
                    they pay the user's debt and recieve equivalent amount of user's collateal + some extra
                    percentage of the collateral i.e. Liquidation Penalty
                </li>
                <li><strong>Deposit APY</strong> - Deposit Annual Percentage Yield is the interest in percentage terms that
                    can be earned on deposited asset in a year, if the current state of the protocol persists.
                </li>
                <li><strong>Borrow APY</strong> - Borrow Annual Percentage Yield is the interest in percentage terms that
                    that has to be paid on borrowed asset in a year, if the current state of the protocol persists.
                </li>
                <li><strong>Percentage Utilization</strong> - Ratio of total amount borrowed to the total amount
                    supplied in an asset.</li>
                <li><strong>Variable Rate</strong> - Refi is a variable rate based protocol i.e. Deposit and Borrow APYs are adjusted
                    after every transaction using the amount of asset deposited and amount of asset borrowed.</li>
            </ul>

            <section id="benefits">
                dlfka;f
            </section>
        </main>
    );
}

export default DocsPage;