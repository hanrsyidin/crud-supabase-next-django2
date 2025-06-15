// frontend/app/page.tsx
'use client'; // Wajib ada untuk menggunakan hooks seperti useState dan useEffect

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

// 1. Mendefinisikan tipe data untuk produk kita
// Ini akan membantu TypeScript menangkap kesalahan jika kita salah menggunakan tipe data
interface Product {
  id: number;
  name: string;
  description: string | null; // Deskripsi bisa jadi null
  price: string; // Model DecimalField Django sering kali dikirim sebagai string
}

// Konfigurasi koneksi ke API Django
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Alamat backend kita
});

export default function Home() {
  // State untuk menyimpan daftar produk, dengan tipe Product[]
  const [products, setProducts] = useState<Product[]>([]);
  
  // State untuk data formulir, kita definisikan tipenya secara parsial
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
  });

  // State untuk melacak ID produk yang sedang diedit
  const [editingId, setEditingId] = useState<number | null>(null);

  // Fungsi untuk mengambil semua produk dari backend
  const fetchProducts = async () => {
    try {
      const response = await apiClient.get<Product[]>('/products/');
      setProducts(response.data);
    } catch (error) {
      console.error('Gagal mengambil data produk:', error);
    }
  };

  // useEffect akan berjalan sekali saat komponen pertama kali dimuat
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handler saat input formulir berubah, dengan tipe event dari React
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler saat formulir disubmit (untuk membuat atau update)
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Membuat objek data yang akan dikirim, memastikan price adalah angka
    const submissionData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
    };

    if (editingId) {
      // Logika untuk UPDATE
      try {
        await apiClient.put(`/products/${editingId}/`, submissionData);
        setEditingId(null); // Keluar dari mode edit
      } catch (error) {
        console.error('Gagal mengupdate produk:', error);
      }
    } else {
      // Logika untuk CREATE
      try {
        await apiClient.post('/products/', submissionData);
      } catch (error) {
        console.error('Gagal membuat produk:', error);
      }
    }
    // Reset formulir
    setFormData({ name: '', description: '', price: '' });
    // Muat ulang daftar produk
    fetchProducts(); 
  };

  // Handler untuk memulai mode edit
  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description || '', // Pastikan tidak null
      price: String(product.price),
    });
  };

  // Handler untuk menghapus produk
  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/products/${id}/`);
      fetchProducts(); // Muat ulang daftar produk
    } catch (error) {
      console.error('Gagal menghapus produk:', error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-50">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Manajemen Produk (TypeScript)</h1>

        {/* Formulir untuk Create dan Update */}
        <form onSubmit={handleSubmit} className="mb-12 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nama Produk"
              required
              className="p-2 border rounded-md"
            />
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Deskripsi"
              className="p-2 border rounded-md"
            />
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="Harga"
              required
              step="0.01"
              className="p-2 border rounded-md"
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">
            {editingId ? 'Update Produk' : 'Simpan Produk'}
          </button>
        </form>

        {/* Daftar Produk */}
        <div className="bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold p-6">Daftar Produk</h2>
          <div className="divide-y divide-gray-200">
            {products.map((product) => (
              <div key={product.id} className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                  <p className="text-gray-600">{product.description}</p>
                  <p className="text-lg font-semibold text-green-600 mt-2">
                    Rp {Number(product.price).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleEdit(product)} className="bg-yellow-400 text-white px-4 py-2 rounded-md hover:bg-yellow-500">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}