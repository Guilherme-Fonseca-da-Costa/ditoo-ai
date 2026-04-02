import React from 'react';
import { useNavigate } from 'react-router';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Página não encontrada</p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded"
                >
                    Voltar ao Início
                </button>
            </div>
        </div>
    );
};

export default NotFound;