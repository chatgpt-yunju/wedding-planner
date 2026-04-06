import { useState, useEffect } from 'react';
import { useInitializeSync } from './hooks/useSync';
import { register, login, getCoupleInfo } from './lib/api';
import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [couple, setCouple] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 尝试从本地存储恢复登录状态
    const token = localStorage.getItem('accessToken');
    if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const coupleInfo = await getCoupleInfo(token);
      setUser(coupleInfo.user);
      setCouple(coupleInfo.couple);
      localStorage.setItem('accessToken', token);
      useInitializeSync(token, coupleInfo.couple.id);
    } catch (err) {
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const data = await login(email, password);
    localStorage.setItem('accessToken', data.tokens.accessToken);
    setUser(data.user);
    if (data.couple) {
      setCouple(data.couple);
      useInitializeSync(data.tokens.accessToken, data.couple.id);
    } else {
      // 用户注册后尚未配对，显示配对页面
      setCouple(data.couple);
    }
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    const data = await register(email, password, name);
    localStorage.setItem('accessToken', data.tokens.accessToken);
    setUser(data.user);
    setCouple(data.couple); // pending couple
    useInitializeSync(data.tokens.accessToken, data.couple.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setCouple(null);
    // TODO: 调用 logout API
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return <Dashboard user={user} couple={couple} onLogout={handleLogout} />;
}

export default App;
