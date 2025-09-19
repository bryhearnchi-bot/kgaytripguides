import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, Ship, MapPin, Users, Palette, Eye, Edit2, MoreVertical } from 'lucide-react';
import { api } from '@/lib/api';

interface Cruise {
  id: number;
  name: string;
  status: 'upcoming' | 'active' | 'past';
  startDate: string;
  endDate: string;
  shipName: string;
  cruiseLine: string;
  portCount?: number;
  artistCount?: number;
  themeCount?: number;
  completionPercentage?: number;
}

export function AdminDashboard() {
  const [cruises, setCruises] = useState<Cruise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCruises();
  }, [filter]);

  const fetchCruises = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/cruises');
      let filteredCruises = response.data;

      if (filter !== 'all') {
        filteredCruises = filteredCruises.filter((cruise: Cruise) =>
          filter === 'upcoming' ? cruise.status === 'upcoming' : cruise.status === 'active'
        );
      }

      setCruises(filteredCruises);
    } catch (error) {
      console.error('Error fetching cruises:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#06FFA5';
      case 'upcoming': return '#00B4D8';
      case 'past': return '#9CA3AF';
      default: return '#9CA3AF';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="dashboard">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-content">
          <div className="page-header">
            <h1>Cruise Management Dashboard</h1>
            <p>Manage all your cruise guides in one place</p>
          </div>
          <Link to="/admin/cruises/new" className="btn-primary">
            <Plus size={20} />
            Create New Cruise
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Cruises
        </button>
        <button
          className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          In Progress
        </button>
      </div>

      {/* Cruise Cards Grid */}
      <div className="cruise-grid">
        {loading ? (
          <div className="loading">Loading cruises...</div>
        ) : cruises.length === 0 ? (
          <div className="empty-state">
            <Ship size={48} />
            <h3>No cruises found</h3>
            <p>Start by creating your first cruise guide</p>
            <Link to="/admin/cruises/new" className="btn-primary">
              <Plus size={20} />
              Create New Cruise
            </Link>
          </div>
        ) : (
          cruises.map((cruise) => (
            <div key={cruise.id} className="cruise-card">
              <div className="card-header">
                <div className="cruise-status" style={{ backgroundColor: getStatusColor(cruise.status) }}>
                  {cruise.status.toUpperCase()}
                </div>
                <button className="menu-button">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="card-content">
                <h3>{cruise.name}</h3>

                <div className="cruise-info">
                  <div className="info-item">
                    <Calendar size={16} />
                    <span>{formatDate(cruise.startDate)} - {formatDate(cruise.endDate)}</span>
                  </div>
                  <div className="info-item">
                    <Ship size={16} />
                    <span>{cruise.shipName}</span>
                  </div>
                </div>

                <div className="cruise-stats">
                  <div className="stat">
                    <MapPin size={16} />
                    <span>{cruise.portCount || 0} Ports</span>
                  </div>
                  <div className="stat">
                    <Users size={16} />
                    <span>{cruise.artistCount || 0} Artists</span>
                  </div>
                  <div className="stat">
                    <Palette size={16} />
                    <span>{cruise.themeCount || 0} Themes</span>
                  </div>
                </div>

                <div className="completion-bar">
                  <div className="completion-label">
                    <span>Completion</span>
                    <span>{cruise.completionPercentage || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${cruise.completionPercentage || 0}%` }}
                    />
                  </div>
                </div>

                <div className="card-actions">
                  <Link to={`/admin/cruises/${cruise.id}`} className="btn-secondary">
                    <Eye size={16} />
                    View
                  </Link>
                  <Link to={`/admin/cruises/${cruise.id}/edit`} className="btn-secondary">
                    <Edit2 size={16} />
                    Edit
                  </Link>
                  <button className="btn-primary">
                    Manage Guide
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .dashboard {
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Top Bar */
        .top-bar {
          height: 80px;
          background: white;
          border-bottom: 1px solid #E5E7EB;
          padding: 0 32px;
          display: flex;
          align-items: center;
        }

        .top-bar-content {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: #0A1628;
          margin-bottom: 4px;
        }

        .page-header p {
          font-size: 14px;
          color: #64748B;
        }

        .btn-primary {
          background: linear-gradient(135deg, #00B4D8 0%, #0077B6 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 180, 216, 0.3);
        }

        .btn-secondary {
          background: white;
          color: #475569;
          padding: 8px 16px;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .btn-secondary:hover {
          background: #F8FAFC;
          border-color: #D1D5DB;
        }

        /* Filters */
        .filter-tabs {
          padding: 24px 32px 0;
          display: flex;
          gap: 24px;
          border-bottom: 1px solid #E5E7EB;
          background: white;
        }

        .filter-tab {
          padding: 12px 0;
          background: transparent;
          border: none;
          color: #64748B;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          transition: color 0.2s ease;
        }

        .filter-tab:hover {
          color: #334155;
        }

        .filter-tab.active {
          color: #00B4D8;
        }

        .filter-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: #00B4D8;
          border-radius: 2px 2px 0 0;
        }

        /* Cruise Grid */
        .cruise-grid {
          padding: 32px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 24px;
          flex: 1;
          overflow-y: auto;
        }

        .cruise-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .cruise-card:hover {
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .card-header {
          background: linear-gradient(135deg, #1e3a5f 0%, #0f2238 100%);
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cruise-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          color: #0A1628;
        }

        .menu-button {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: background 0.2s ease;
        }

        .menu-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .card-content {
          padding: 20px;
        }

        .card-content h3 {
          font-size: 18px;
          font-weight: 600;
          color: #0A1628;
          margin-bottom: 16px;
        }

        .cruise-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748B;
          font-size: 14px;
        }

        .cruise-stats {
          display: flex;
          gap: 16px;
          padding: 16px 0;
          border-top: 1px solid #F1F5F9;
          border-bottom: 1px solid #F1F5F9;
          margin-bottom: 20px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #475569;
          font-size: 14px;
        }

        .completion-bar {
          margin-bottom: 20px;
        }

        .completion-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
          color: #64748B;
        }

        .progress-bar {
          height: 8px;
          background: #F1F5F9;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00B4D8 0%, #06FFA5 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .card-actions {
          display: flex;
          gap: 8px;
        }

        .card-actions .btn-primary {
          flex: 1;
          justify-content: center;
          padding: 10px 16px;
          font-size: 14px;
        }

        /* Empty State */
        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
          text-align: center;
          color: #64748B;
        }

        .empty-state h3 {
          margin-top: 16px;
          margin-bottom: 8px;
          font-size: 20px;
          color: #334155;
        }

        .empty-state .btn-primary {
          margin-top: 24px;
        }

        .loading {
          grid-column: 1 / -1;
          text-align: center;
          padding: 64px;
          color: #64748B;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .cruise-grid {
            grid-template-columns: 1fr;
            padding: 16px;
          }

          .top-bar {
            padding: 0 16px;
          }

          .filter-tabs {
            padding: 16px 16px 0;
          }
        }
      `}</style>
    </div>
  );
}