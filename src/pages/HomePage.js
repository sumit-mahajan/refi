import { useEffect, useState } from "react";
import Box from "../components/Box";
import { useConnection } from "../connection_provider";

export default function HomePage() {
    const { connectionState } = useConnection();
    const { accounts, greeterContract } = connectionState;

    const [message, setMessage] = useState('')

    useEffect(() => {
        if (greeterContract) {
            getGreeting();
        }
    }, [greeterContract])

    const getGreeting = async () => {
        try {
            const temp = await greeterContract.greet();
            setMessage(temp);
        } catch (e) {
            setMessage(e.toString());
        }
    }

    const setGreeting = async () => {
        const transaction = await greeterContract.setGreeting('Hi This is Sumit');
        await transaction.wait();
        getGreeting();
    }

    return (
        <>
            <main className="container">
                <Box height={40} />
                Greeting message: {message}
                <br />
                <br />
                Connect to Set Greeting
                <br />
                {accounts.length > 0 && <button onClick={setGreeting}>Set</button>}
            </main>
        </>
    );
}