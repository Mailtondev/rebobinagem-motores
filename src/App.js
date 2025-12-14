import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCwQL3DzLpHQ0ZcTip10rhFUGa_Uyli9jU",
  authDomain: "rebobinagem-motores.firebaseapp.com",
  projectId: "rebobinagem-motores",
  storageBucket: "rebobinagem-motores.firebasestorage.app",
  messagingSenderId: "634987348762",
  appId: "1:634987348762:web:c68e9043a3a23dee47a2a3"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export default function TesteUploadFoto() {
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoURL, setFotoURL] = useState(null);
  const [fotoModal, setFotoModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Arquivo selecionado:', file.name, file.size, 'bytes');
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!fotoFile) {
      setErro('Selecione uma foto primeiro!');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      console.log('Iniciando upload...');
      const timestamp = Date.now();
      const filename = `teste_${timestamp}_${fotoFile.name}`;
      const storageRef = ref(storage, `fotos_teste/${filename}`);
      
      console.log('Caminho:', `fotos_teste/${filename}`);
      
      const snapshot = await uploadBytes(storageRef, fotoFile);
      console.log('Upload completo:', snapshot);

      const url = await getDownloadURL(storageRef);
      console.log('URL obtida:', url);
      
      setFotoURL(url);
      setErro('');
      alert('Foto enviada com SUCESSO! ✅');
    } catch (e) {
      console.error('ERRO COMPLETO:', e);
      setErro('Erro: ' + e.message);
      alert('ERRO: ' + e.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">🔍 Teste de Upload de Foto</h1>

          {/* Upload */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-3">Selecione uma foto:</label>
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:bg-blue-100 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
                id="foto-input"
              />
              <label htmlFor="foto-input" className="cursor-pointer flex flex-col items-center">
                {fotoPreview ? (
                  <div className="w-full">
                    <img src={fotoPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg mb-2" />
                    <p className="text-blue-600 font-semibold">Clique para trocar</p>
                  </div>
                ) : (
                  <div>
                    <Camera size={48} className="text-blue-400 mx-auto mb-2" />
                    <p className="text-blue-700 font-semibold">Clique para selecionar foto</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Botão Upload */}
          <div className="mb-8">
            <button
              onClick={handleUpload}
              disabled={loading || !fotoFile}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Enviando...' : '📤 Enviar Foto para Firebase'}
            </button>
          </div>

          {/* Erro */}
          {erro && (
            <div className="bg-red-100 border-2 border-red-400 text-red-800 px-4 py-3 rounded-lg mb-8">
              <p className="font-bold">❌ ERRO:</p>
              <p>{erro}</p>
            </div>
          )}

          {/* Sucesso */}
          {fotoURL && (
            <div className="bg-green-100 border-2 border-green-400 rounded-lg p-6 mb-8">
              <p className="text-green-800 font-bold mb-3">✅ Foto enviada com sucesso!</p>
              <button
                onClick={() => setFotoModal(fotoURL)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold"
              >
                👁️ Ver Foto no Modal
              </button>
              <p className="text-gray-600 text-sm mt-3 break-all">
                URL: <code className="bg-gray-200 px-2 py-1 rounded">{fotoURL}</code>
              </p>
            </div>
          )}

          {/* Informações de Debug */}
          <div className="bg-gray-100 rounded-lg p-4 mt-8">
            <h3 className="font-bold text-gray-800 mb-2">📊 Debug Info:</h3>
            <p className="text-sm text-gray-700">Arquivo: {fotoFile ? fotoFile.name : 'nenhum'}</p>
            <p className="text-sm text-gray-700">Tamanho: {fotoFile ? (fotoFile.size / 1024).toFixed(2) + ' KB' : 'N/A'}</p>
            <p className="text-sm text-gray-700">Status: {loading ? '⏳ Enviando' : fotoURL ? '✅ Enviado' : '⏹️ Aguardando'}</p>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {fotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Foto Enviada</h3>
              <button
                onClick={() => setFotoModal(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 flex justify-center bg-gray-50">
              <img src={fotoModal} alt="Foto" className="max-w-full max-h-96 rounded-lg" />
            </div>
            <div className="flex justify-center p-6 border-t gap-3">
              <button
                onClick={() => setFotoModal(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
