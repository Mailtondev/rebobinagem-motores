<td className="px-6 py-4 text-center">
                        {rebob.foto ? (
                          <button
                            onClick={() => setFotoModal(rebob.foto)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold"
                          >
                            📸 Ver
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">Sem foto</span>
                        )}
                      </td>import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, LogOut, Camera } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwQL3DzLpHQ0ZcTip10rhFUGa_Uyli9jU",
  authDomain: "rebobinagem-motores.firebaseapp.com",
  projectId: "rebobinagem-motores",
  storageBucket: "rebobinagem-motores.firebasestorage.app",
  messagingSenderId: "634987348762",
  appId: "1:634987348762:web:c68e9043a3a23dee47a2a3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function RebobinagemApp() {
  const [user, setUser] = useState(null);
  const [rebobinagens, setRebobinagens] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ email: '', senha: '' });
  const [fotoModal, setFotoModal] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    cliente: '',
    cv: '',
    polos: '',
    marca: '',
    foto: null,
    fotoPreview: '',
    dataServico: new Date().toISOString().split('T')[0]
  });

  // Verificar se usuário já está logado
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        carregarDados(currentUser.uid);
      } else {
        setUser(null);
        setRebobinagens([]);
      }
    });
    return unsubscribe;
  }, []);

  // Carregar dados do Firestore
  const carregarDados = async (userId) => {
    try {
      const q = query(collection(db, 'rebobinagens'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const dados = [];
      querySnapshot.forEach((doc) => {
        dados.push({ ...doc.data(), id: doc.id });
      });
      setRebobinagens(dados);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      alert('Erro ao carregar dados: ' + e.message);
    }
  };

  const handleLogin = async () => {
    if (!authData.email || !authData.senha) {
      alert('Preencha email e senha');
      return;
    }

    setLoading(true);

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authData.email, authData.senha);
      } else {
        await createUserWithEmailAndPassword(auth, authData.email, authData.senha);
      }
      setAuthData({ email: '', senha: '' });
    } catch (error) {
      alert('Erro: ' + error.message);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          foto: reader.result,
          fotoPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddRebobinagem = async () => {
    if (!formData.cliente || !formData.cv || !formData.polos || !formData.marca) {
      alert('Preencha todos os campos!');
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        // Atualizar
        const updateData = {
          cliente: formData.cliente,
          cv: formData.cv,
          polos: formData.polos,
          marca: formData.marca,
          dataServico: formData.dataServico
        };
        
        // Se tem foto nova, salva
        if (formData.foto && formData.foto !== formData.fotoPreview) {
          updateData.foto = formData.foto;
        } else if (formData.fotoPreview && !formData.foto) {
          // Mantém a foto anterior
          updateData.foto = formData.fotoPreview;
        }

        await updateDoc(doc(db, 'rebobinagens', editingId), updateData);
        setEditingId(null);
      } else {
        // Adicionar novo
        await addDoc(collection(db, 'rebobinagens'), {
          userId: user.uid,
          cliente: formData.cliente,
          cv: formData.cv,
          polos: formData.polos,
          marca: formData.marca,
          foto: formData.foto || null,
          dataServico: formData.dataServico,
          dataCriacao: new Date()
        });
      }

      setFormData({
        id: '', cliente: '', cv: '', polos: '', marca: '', foto: null, fotoPreview: '',
        dataServico: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      carregarDados(user.uid);
    } catch (e) {
      alert('Erro ao salvar: ' + e.message);
    }

    setLoading(false);
  };

  const handleEdit = (rebob) => {
    setFormData({
      id: rebob.id,
      cliente: rebob.cliente,
      cv: rebob.cv,
      polos: rebob.polos,
      marca: rebob.marca,
      foto: null,
      fotoPreview: rebob.foto || '',
      dataServico: rebob.dataServico
    });
    setEditingId(rebob.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja deletar este registro?')) {
      try {
        await deleteDoc(doc(db, 'rebobinagens', id));
        carregarDados(user.uid);
      } catch (e) {
        alert('Erro ao deletar: ' + e.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      id: '', cliente: '', cv: '', polos: '', marca: '', foto: null, fotoPreview: '',
      dataServico: new Date().toISOString().split('T')[0]
    });
  };

  // Tela de Login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">⚡ Rebobinagem</h1>
          <p className="text-center text-gray-600 mb-8">Motores Elétricos</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={authData.email}
                onChange={(e) => setAuthData({...authData, email: e.target.value})}
                placeholder="seu@email.com"
                className="w-full border-2 border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Senha</label>
              <input
                type="password"
                value={authData.senha}
                onChange={(e) => setAuthData({...authData, senha: e.target.value})}
                placeholder="••••••••"
                className="w-full border-2 border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Carregando...' : authMode === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {authMode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-blue-600 font-bold hover:text-blue-700"
              >
                {authMode === 'login' ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tela Principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white">⚡ Rebobinagem de Motores</h1>
              <p className="text-blue-100 mt-2">{user.email}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-white hover:bg-blue-50 text-blue-600 px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg font-bold"
              >
                <Plus size={24} /> Novo
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg font-bold"
              >
                <LogOut size={24} /> Sair
              </button>
            </div>
          </div>

          {/* Formulário */}
          {showForm && (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 border-b-4 border-blue-300">
              <h2 className="text-2xl font-bold text-blue-800 mb-8">
                {editingId ? '✏️ Editar Registro' : '➕ Novo Registro'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-blue-700 mb-2">Cliente</label>
                  <input
                    type="text"
                    name="cliente"
                    placeholder="Nome do cliente"
                    value={formData.cliente}
                    onChange={handleInputChange}
                    className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-blue-700 mb-2">CV</label>
                  <input
                    type="text"
                    name="cv"
                    placeholder="ex: 1, 2, 3, 5"
                    value={formData.cv}
                    onChange={handleInputChange}
                    className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-blue-700 mb-2">Pólos</label>
                  <input
                    type="text"
                    name="polos"
                    placeholder="ex: 4, 6, 8"
                    value={formData.polos}
                    onChange={handleInputChange}
                    className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-blue-700 mb-2">Marca</label>
                  <input
                    type="text"
                    name="marca"
                    placeholder="ex: WEG, SIEMENS, etc"
                    value={formData.marca}
                    onChange={handleInputChange}
                    className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-blue-700 mb-3">📸 Foto do Bloco/Esquema</label>
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:bg-blue-100 transition cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                    id="foto-input"
                  />
                  <label htmlFor="foto-input" className="cursor-pointer flex flex-col items-center">
                    {formData.fotoPreview ? (
                      <div className="w-full">
                        <img src={formData.fotoPreview} alt="Preview" className="max-h-32 mx-auto rounded-lg mb-2" />
                        <p className="text-blue-600 font-semibold">Clique para trocar foto</p>
                      </div>
                    ) : (
                      <div>
                        <Camera size={32} className="text-blue-400 mx-auto mb-2" />
                        <p className="text-blue-700 font-semibold">Clique para adicionar foto</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddRebobinagem}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition font-bold shadow-lg disabled:opacity-50"
                >
                  <Save size={20} /> {loading ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition font-bold"
                >
                  <X size={20} /> Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Tabela */}
          {rebobinagens.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500 text-lg font-semibold">Nenhum registro. Adicione um novo!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                    <th className="px-6 py-4 text-left font-bold">Cliente</th>
                    <th className="px-6 py-4 text-left font-bold">CV</th>
                    <th className="px-6 py-4 text-left font-bold">Pólos</th>
                    <th className="px-6 py-4 text-left font-bold">Marca</th>
                    <th className="px-6 py-4 text-left font-bold">Data</th>
                    <th className="px-6 py-4 text-left font-bold">Foto</th>
                    <th className="px-6 py-4 text-center font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rebobinagens.map((rebob, idx) => (
                    <tr 
                      key={rebob.id} 
                      className={`border-b-2 border-blue-100 hover:bg-blue-50 transition ${
                        idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-gray-800">{rebob.cliente}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gradient-to-r from-blue-200 to-cyan-200 text-blue-800 px-3 py-1 rounded-full font-bold">
                          {rebob.cv} CV
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gradient-to-r from-blue-200 to-cyan-200 text-blue-800 px-3 py-1 rounded-full font-bold">
                          {rebob.polos} P
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{rebob.marca}</td>
                      <td className="px-6 py-4 text-gray-600">{rebob.dataServico}</td>
                      <td className="px-6 py-4 text-center">
                        {rebob.foto ? (
                          <button
                            onClick={() => window.open(rebob.foto, '_blank')}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold"
                          >
                            📸 Ver
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">Sem foto</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleEdit(rebob)}
                          className="text-blue-600 hover:text-blue-800 mr-4 inline-block transition"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(rebob.id)}
                          className="text-red-600 hover:text-red-800 inline-block transition"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-8 py-6 border-t-4 border-blue-300">
            <p className="text-lg font-bold text-blue-800">
              📊 Total: <span className="text-blue-600">{rebobinagens.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Foto */}
      {fotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Foto do Motor</h3>
              <button
                onClick={() => setFotoModal(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex justify-center">
              <img src={fotoModal} alt="Foto do motor" className="max-w-full max-h-96 rounded-lg" />
            </div>
            <div className="flex justify-center p-6 border-t">
              <button
                onClick={() => setFotoModal(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
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
