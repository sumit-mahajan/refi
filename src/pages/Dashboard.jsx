import Box from "../components/Box";
import "../styles/dashboard.scss";

const Dashboard = () => {
    return (
        <>
            <Box height={80} />

            <section className="credit-flex">
                <img src="/images/card.svg" alt="Credit card" />
                <Box width={60} />
                <div>
                    <h3>Your Credit Score</h3>
                    <h1>864</h1>
                    <p>You are platinum user. You belong to the most elite users on the protocol</p>
                </div>
                <div className="opensea-btn">
                    <a>View on OpenSea</a>
                </div>
            </section>
            <Box height={40} />
            <hr />

            <Box height={40} />

            <section className="data-flex">
                <div>
                    <h4>Total Supply</h4>
                    <h2>$ 98.32</h2>
                </div>
                <div className="vr"></div>
                <div>
                    <h4>Health Factor</h4>
                    <h2>2.268</h2>
                </div>
                <div className="vr"></div>
                <div>
                    <h4>Total Borrowed</h4>
                    <h2>$ 68.52</h2>
                </div>
            </section>

            <Box height={60} />

            <section className="dnb">
                <div className="dnb-col">
                    <h4>Supplied Assets</h4>
                    <Box height={10} />
                    <hr />
                    <div className="dnb-asset-tile">
                        <img
                            className="mr-2"
                            src="/images/DAI.svg"
                            alt="Crypto Icon"
                        />
                        <p>4.35 DAI</p>
                        <strong><p>$ 4.35 </p></strong>
                    </div>
                    <hr />
                </div>
                <Box width={100} />
                <div className="dnb-col">
                    <h4>Borrowed Assets</h4>
                    <Box height={10} />
                    <hr />
                    <div className="dnb-asset-tile">
                        <img
                            className="mr-2"
                            src="/images/LINK.svg"
                            alt="Crypto Icon"
                        />
                        <p>3.5 LINK</p>
                        <strong><p>$ 54.35 </p></strong>
                    </div>
                    <hr />
                    <div className="dnb-asset-tile">
                        <img
                            className="mr-2"
                            src="/images/LINK.svg"
                            alt="Crypto Icon"
                        />
                        <p>3.5 LINK</p>
                        <strong><p>$ 54.35 </p></strong>
                    </div>
                    <hr />
                </div>
            </section>

            <Box height={40} />
        </>
    );
}

export default Dashboard;