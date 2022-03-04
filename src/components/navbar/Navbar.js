import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { supportedNetworks, useConnection } from '../../connection_provider';
import Box from '../Box';
import Chip from '../chip/Chip';
import './navbar.scss'

function Navbar() {
    const { connectionState, connectWallet } = useConnection();
    const { chainId, accounts } = connectionState;

    const navigate = useNavigate();

    return (
        <div>
            <nav className="navbar flex-betn-ctr">
                <div className="logo">ReFi</div>

                <div className="nav-btn-flex">
                    <Chip bgColor="var(--accent)" textColor="white" content={supportedNetworks[chainId].name} />

                    <Box width="20" />

                    {accounts.length > 0 ?
                        <Chip
                            bgColor="var(--accent)"
                            textColor="white"
                            content={
                                accounts[0].substring(0, 5) + '...' + accounts[0].substring(accounts[0].length - 3, accounts[0].length)
                            } /> :
                        <Chip
                            onclick={connectWallet}
                            bgColor="var(--accent)"
                            textColor="white"
                            content="Connect"
                        />
                    }
                </div>
            </nav>
        </div>
    );
}

export default Navbar;