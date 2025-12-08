import React from 'react';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-black text-gray-500 py-12 px-4 border-t border-gray-900 mt-20 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Social Icons */}
        <div className="flex gap-6 mb-8 text-white">
          <Facebook className="h-6 w-6 cursor-pointer hover:text-brand transition-colors" />
          <Instagram className="h-6 w-6 cursor-pointer hover:text-brand transition-colors" />
          <Twitter className="h-6 w-6 cursor-pointer hover:text-brand transition-colors" />
          <Youtube className="h-6 w-6 cursor-pointer hover:text-brand transition-colors" />
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-8">
          <div className="flex flex-col gap-3">
            <a href="#" className="hover:underline hover:text-white">Audiodescrição</a>
            <a href="#" className="hover:underline hover:text-white">Relações com Investidores</a>
            <a href="#" className="hover:underline hover:text-white">Avisos legais</a>
          </div>
          <div className="flex flex-col gap-3">
            <a href="#" className="hover:underline hover:text-white">Central de Ajuda</a>
            <a href="#" className="hover:underline hover:text-white">Carreiras</a>
            <a href="#" className="hover:underline hover:text-white">Preferências de cookies</a>
          </div>
          <div className="flex flex-col gap-3">
            <a href="#" className="hover:underline hover:text-white">Cartão pré-pago</a>
            <a href="#" className="hover:underline hover:text-white">Termos de Uso</a>
            <a href="#" className="hover:underline hover:text-white">Informações corporativas</a>
          </div>
          <div className="flex flex-col gap-3">
            <a href="#" className="hover:underline hover:text-white">Imprensa</a>
            <a href="#" className="hover:underline hover:text-white">Privacidade</a>
            <a href="#" className="hover:underline hover:text-white">Entre em contato</a>
          </div>
        </div>

        {/* Service Code Button */}
        <button className="border border-gray-500 text-gray-500 px-4 py-2 text-sm hover:text-white hover:border-white transition-colors mb-6">
          Código do serviço
        </button>

        {/* Copyright */}
        <div className="text-xs">
          <p>&copy; 2024 ZionFlix, Inc.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;