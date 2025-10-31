import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          SlotSwapper
        </Link>
        
        {isAuthenticated && (
          <ul className="navbar-menu">
            <li className={isActive('/dashboard') ? 'active' : ''}>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li className={isActive('/marketplace') ? 'active' : ''}>
              <Link to="/marketplace">Marketplace</Link>
            </li>
            <li className={isActive('/requests') ? 'active' : ''}>
              <Link to="/requests">Requests</Link>
            </li>
          </ul>
        )}
        
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <span className="navbar-user">Hi, {user?.name}</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;