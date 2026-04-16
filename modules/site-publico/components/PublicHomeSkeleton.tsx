import React from 'react';

const PublicHomeSkeleton: React.FC = () => {
    return (
        <div className="animate-in fade-in duration-500">
            {/* Mantemos o esqueleto vazio para que a página não fique 'pulando' 
                mas sem desenhar os cards que seriam removidos depois. 
                Isso atende ao pedido de 'escondido por padrão' */}
            <div className="h-20 lg:h-32"></div> {/* Espaço para o Hero carregar */}
        </div>
    );
};

export default PublicHomeSkeleton;
