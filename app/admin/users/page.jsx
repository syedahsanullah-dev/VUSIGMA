'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Users, Plus, Trash2, Edit2, X, Shield } from 'lucide-react';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT'
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openModal = (usr = null) => {
    if (usr) {
      setCurrentUser(usr);
      setFormData({
        name: usr.name,
        email: usr.email,
        password: '',
        role: usr.role || 'STUDENT'
      });
    } else {
      setCurrentUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (currentUser) {
        await api.put(`/users/${currentUser.id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      await fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        await fetchUsers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>User Accounts Management</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">Manage user roles and administrative accounts.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Create User</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-800/50">
                <td className="p-4 font-bold text-white">{u.name}</td>
                <td className="p-4 text-slate-400">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    u.role === 'SUPER_ADMIN'
                      ? 'bg-purple-950 text-purple-300 border-purple-900'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => openModal(u)} className="text-slate-400 hover:text-white">
                    <Edit2 className="w-4 h-4 inline" />
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">{currentUser ? 'Edit User' : 'Create User'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@vusigma.com"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl"
                  required
                  disabled={!!currentUser}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Password {currentUser && '(Leave blank to keep unchanged)'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl"
                  {...(!currentUser && { required: true })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">User Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl"
                >
                  <option value="STUDENT">Student</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
                  {saving ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
