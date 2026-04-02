import React from 'react';
import { useNavigate } from 'react-router';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div id="notFoundPage">
            <div className="">
                <h1 style={{fontSize: '14em', color: "#858585", marginBottom: 0, marginTop: 20}}>404</h1>
                <p style={{fontFamily: 'Google-sans', color: "#858585", fontSize: '2em', fontWeight: 'bold'}}>Página não encontrada</p>
                <button
                    onClick={() => navigate('/chat')}
                    id='notFoundReturnButton'
                >
                    Voltar ao Início
                </button>
            </div>
        </div>
    );
};

export default NotFound;