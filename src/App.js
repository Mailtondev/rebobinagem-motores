import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, LogOut, Camera } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

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
    cliente: '',
    cv: '',
    polos: '',
    marca: '',
    fotoFile: null,
    fotoPreview: null,
    dataServico: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        carregarDados(currentUser.uid);
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

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
      console.error('Erro:', e);
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
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, fotoFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, fotoPreview: reader.result }));
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
      let fotoURL = '';

      if (formData.fotoFile) {
        const timestamp = Date.now();
        const filename = `${timestamp}_${formData.fotoFile.name}`;
        const storageRef = ref(storage, `fotos/${user.uid}/${filename}`);
        await uploadBytes(storageRef, formData.fotoFile);
        fotoURL = await getDownloadURL(storageRef);
      }

      if (editingId) {
        const updateData = {
          cliente: formData.cliente,
          cv: formData.cv,
          polos: formData.polos,
          marca: formData.marca,
          dataServico: formData.dataServico
        };
        if (fotoURL) updateData.fotoURL = fotoURL;
        await updateDoc(doc(db, 'rebobinagens', editingId), updateData);
      } else {
        await addDoc(collection(db, 'rebobinagens'), {
          userId: user.uid,
          cliente: formData.cliente,
          cv: formData.cv,
          polos: formData.polos,
          marca: formData.marca,
          fotoURL: fotoURL || '',
          dataServico: formData.dataServico,
          dataCriacao: new Date()
        });
      }

      setFormData({
        cliente: '', cv: '', polos: '', marca: '',
        fotoFile: null, fotoPreview: null,
        dataServico: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      setEditingId(null);
      carregarDados(user.uid);
    } catch (e) {
      alert('Erro: ' + e.message);
    }
    setLoading(false);
  };

  const handleEdit = (rebob) => {
    setFormData({
      cliente: rebob.cliente,
      cv: rebob.cv,
      polos: rebob.polos,
      marca: rebob.marca,
      fotoFile: null,
      fotoPreview: rebob.fotoURL || null,
      dataServico: rebob.dataServico
    });
    setEditingId(rebob.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deletar?')) {
      try {
        await deleteDoc(doc(db, 'rebobinagens', id));
        carregarDados(user.uid);
      } catch (e) {
        alert('Erro: ' + e.message);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">⚡ Rebobinagem</h1>
          <p className="text-center text-gray-600 mb-8">Motores Elétricos</p>
          <div className="space-y-4">
            <input type="email" value={authData.email} onChange={(e) => setAuthData({...authData, email: e.target.value})} placeholder="seu@email.com" className="w-full border-2 border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="password" value={authData.senha} onChange={(e) => setAuthData({...authData, senha: e.target.value})} placeholder="••••••••" className="w-full border-2 border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
              {loading ? 'Carregando...' : authMode === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          </div>
          <div className="mt-6 text-center">
            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-blue-600 font-bold text-sm hover:text-blue-700">
              {authMode === 'login' ? 'Cadastre-se' : 'Faça login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white">⚡ Rebobinagem de Motores</h1>
              <p className="text-blue-100 mt-2">{user.email}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(!showForm)} className="bg-white hover:bg-blue-50 text-blue-600 px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg font-bold">
                <Plus size={24} /> Novo
              </button>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg font-bold">
                <LogOut size={24} /> Sair
              </button>
            </div>
          </div>

          {showForm && (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 border-b-4 border-blue-300">
              <h2 className="text-2xl font-bold text-blue-800 mb-8">{editingId ? '✏️ Editar' : '➕ Novo'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <input type="text" placeholder="Cliente" value={formData.cliente} onChange={(e) => setFormData({...formData, cliente: e.target.value})} className="border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="CV" value={formData.cv} onChange={(e) => setFormData({...formData, cv: e.target.value})} className="border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Pólos" value={formData.polos} onChange={(e) => setFormData({...formData, polos: e.target.value})} className="border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Marca" value={formData.marca} onChange={(e) => setFormData({...formData, marca: e.target.value})} className="border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-blue-700 mb-3">📸 Foto</label>
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:bg-blue-100 cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" id="foto-input" />
                  <label htmlFor="foto-input" className="cursor-pointer flex flex-col items-center">
                    {formData.fotoPreview ? (
                      <div className="w-full">
                        <img src={formData.fotoPreview} alt="Preview" className="max-h-32 mx-auto rounded-lg mb-2" />
                        <p className="text-blue-600 font-semibold">Clique para trocar</p>
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
                <button onClick={handleAddRebobinagem} disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-lg flex items-center gap-2 font-bold disabled:opacity-50">
                  <Save size={20} /> {loading ? 'Salvando...' : 'Salvar'}
                </button>
                <button onClick={() => {setShowForm(false); setEditingId(null); setFormData({cliente: '', cv: '', polos: '', marca: '', fotoFile: null, fotoPreview: null, dataServico: new Date().toISOString().split('T')[0]});}} className="bg-gray-400 text-white px-8 py-3 rounded-lg flex items-center gap-2 font-bold">
                  <X size={20} /> Cancelar
                </button>
              </div>
            </div>
          )}

          {rebobinagens.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg font-semibold">Nenhum registro!</p>
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
                    <tr key={rebob.id} className={`border-b-2 border-blue-100 hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                      <td className="px-6 py-4 font-bold text-gray-800">{rebob.cliente}</td>
                      <td className="px-6 py-4"><span className="bg-gradient-to-r from-blue-200 to-cyan-200 text-blue-800 px-3 py-1 rounded-full font-bold">{rebob.cv} CV</span></td>
                      <td className="px-6 py-4"><span className="bg-gradient-to-r from-blue-200 to-cyan-200 text-blue-800 px-3 py-1 rounded-full font-bold">{rebob.polos} P</span></td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{rebob.marca}</td>
                      <td className="px-6 py-4 text-gray-600">{rebob.dataServico}</td>
                      <td className="px-6 py-4 text-center">
                        {rebob.fotoURL ? (
                          <button onClick={() => setFotoModal(rebob.fotoURL)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold">
                            📸 Ver
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">Sem foto</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleEdit(rebob)} className="text-blue-600 hover:text-blue-800 mr-4 inline-block">
                          <Edit2 size={20} />
                        </button>
                        <button onClick={() => handleDelete(rebob.id)} className="text-red-600 hover:text-red-800 inline-block">
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-8 py-6 border-t-4 border-blue-300">
            <p className="text-lg font-bold text-blue-800">📊 Total: <span className="text-blue-600">{rebobinagens.length}</span></p>
          </div>
        </div>
      </div>

      {fotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Foto do Motor</h3>
              <button onClick={() => setFotoModal(null)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button>
            </div>
            <div className="p-6 flex justify-center bg-gray-100">
              <img src={fotoModal} alt="Foto" className="max-w-full max-h-96 rounded-lg" />
            </div>
            <div className="flex justify-center p-6 border-t">
              <button onClick={() => setFotoModal(null)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
