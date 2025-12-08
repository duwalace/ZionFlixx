import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Details from './pages/Details';
import Watch from './pages/Watch';
import Auth from './pages/Auth';
import Register from './pages/Register';
import Movies from './pages/Movies';
import Series from './pages/Series';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Trending from './pages/Trending';
import MyList from './pages/MyList';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/series" element={<Series />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/mylist" element={<MyList />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/details/:id" element={<Details />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;