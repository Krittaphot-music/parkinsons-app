
import React, { useState } from 'react';

function App() {
  const [page, setPage] = useState('home');

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* Header */}
      <header className="bg-blue-700 p-4 text-center">
        <h1 className="text-3xl font-bold">🧠 Parkinson's Helper</h1>
        <p className="text-blue-200 mt-1">ระบบช่วยดูแลผู้ป่วย Parkinson's</p>
        {page !== 'home' && (
          <button onClick={() => setPage('home')} className="mt-2 text-sm bg-blue-900 px-3 py-1 rounded-full">
            ← กลับหน้าหลัก
          </button>
        )}
      </header>

      <main className="p-6 max-w-2xl mx-auto">

        {/* หน้าแรก */}
        {page === 'home' && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-center">เลือกฟังก์ชัน</h2>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setPage('tremor')} className="bg-blue-600 hover:bg-blue-500 p-6 rounded-xl text-center">
                <div className="text-4xl mb-2">🤚</div>
                <div className="font-semibold">ตรวจอาการสั่น</div>
              </button>
              <button onClick={() => setPage('game')} className="bg-green-600 hover:bg-green-500 p-6 rounded-xl text-center">
                <div className="text-4xl mb-2">🎮</div>
                <div className="font-semibold">เกมบำบัด</div>
              </button>
              <button onClick={() => setPage('dashboard')} className="bg-purple-600 hover:bg-purple-500 p-6 rounded-xl text-center">
                <div className="text-4xl mb-2">📊</div>
                <div className="font-semibold">ดูพัฒนาการ</div>
              </button>
              <button onClick={() => setPage('medicine')} className="bg-orange-600 hover:bg-orange-500 p-6 rounded-xl text-center">
                <div className="text-4xl mb-2">💊</div>
                <div className="font-semibold">เตือนกินยา</div>
              </button>
            </div>
          </>
        )}

        {/* หน้าตรวจอาการสั่น */}
        {page === 'tremor' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">🤚 ตรวจอาการสั่น</h2>
            <div className="bg-gray-800 rounded-xl p-8 mb-4">
              <p className="text-gray-400">กล้องจะเปิดที่นี่</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-semibold">
              เริ่มตรวจ
            </button>
          </div>
        )}

        {/* หน้าเกม */}
        {page === 'game' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">🎮 เกมบำบัด</h2>
            <div className="bg-gray-800 rounded-xl p-8 mb-4">
              <p className="text-gray-400">เกมจะแสดงที่นี่</p>
            </div>
            <button className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-xl font-semibold">
              เริ่มเกม
            </button>
          </div>
        )}

        {/* หน้า Dashboard */}
        {page === 'dashboard' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">📊 พัฒนาการ</h2>
            <div className="bg-gray-800 rounded-xl p-8">
              <p className="text-gray-400">กราฟพัฒนาการจะแสดงที่นี่</p>
            </div>
          </div>
        )}

        {/* หน้าเตือนกินยา */}
        {page === 'medicine' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">💊 เตือนกินยา</h2>
            <div className="bg-gray-800 rounded-xl p-8">
              <p className="text-gray-400">ระบบเตือนกินยาจะแสดงที่นี่</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;