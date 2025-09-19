import React, { useState, useEffect } from 'react';
import { Plus, Ship, Users, Calendar, Anchor, Edit2, Trash2, Search } from 'lucide-react';
import { api } from '@/lib/api';

interface Ship {
  id: number;
  name: string;
  cruiseLine: string;
  capacity?: number;
  decks?: number;
  builtYear?: number;
  cruiseCount?: number;
  imageUrl?: string;
}

export function ShipsManagement() {
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShip, setEditingShip] = useState<Ship | null>(null);

  useEffect(() => {
    fetchShips();
  }, []);

  const fetchShips = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/ships');
      setShips(response.data);
    } catch (error) {
      console.error('Error fetching ships:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShips = ships.filter(ship =>
    ship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ship.cruiseLine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this ship?')) {
      try {
        await api.delete(`/api/ships/${id}`);
        await fetchShips();
      } catch (error) {
        console.error('Error deleting ship:', error);
        alert('Cannot delete ship. It may be assigned to cruises.');
      }
    }
  };

  return (
    <div className="ships-management">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-content">
          <div className="page-header">
            <h1>Cruise Ships</h1>
            <p>Manage your fleet information and specifications</p>
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={20} />
            Add New Ship
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search ships by name or cruise line..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Ships Grid */}
      <div className="ships-grid">
        {loading ? (
          <div className="loading">Loading ships...</div>
        ) : filteredShips.length === 0 ? (
          <div className="empty-state">
            <Ship size={48} />
            <h3>No ships found</h3>
            <p>Start by adding your first ship</p>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={20} />
              Add New Ship
            </button>
          </div>
        ) : (
          filteredShips.map((ship) => (
            <div key={ship.id} className="ship-card">
              <div className="card-header">
                <div className="ship-image">
                  {ship.imageUrl ? (
                    <img src={ship.imageUrl} alt={ship.name} />
                  ) : (
                    <div className="placeholder-image">
                      <Ship size={32} />
                    </div>
                  )}
                </div>
              </div>

              <div className="card-content">
                <h3>{ship.name}</h3>
                <p className="cruise-line">{ship.cruiseLine}</p>

                <div className="ship-stats">
                  {ship.capacity && (
                    <div className="stat">
                      <Users size={16} />
                      <span>{ship.capacity.toLocaleString()} Guests</span>
                    </div>
                  )}
                  {ship.decks && (
                    <div className="stat">
                      <Anchor size={16} />
                      <span>{ship.decks} Decks</span>
                    </div>
                  )}
                  {ship.builtYear && (
                    <div className="stat">
                      <Calendar size={16} />
                      <span>Built {ship.builtYear}</span>
                    </div>
                  )}
                </div>

                <div className="usage-info">
                  <span className="usage-label">Assigned to:</span>
                  <span className="usage-count">{ship.cruiseCount || 0} cruises</span>
                </div>

                <div className="card-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setEditingShip(ship)}
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(ship.id)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .ships-management {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #F8FAFC;
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
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .btn-secondary:hover {
          background: #F8FAFC;
          border-color: #D1D5DB;
        }

        .btn-danger {
          background: white;
          color: #EF4444;
          padding: 8px 16px;
          border: 1px solid #FCA5A5;
          border-radius: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .btn-danger:hover {
          background: #FEE2E2;
          border-color: #EF4444;
        }

        /* Search Section */
        .search-section {
          padding: 24px 32px;
          background: white;
          border-bottom: 1px solid #E5E7EB;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #F8FAFC;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          max-width: 500px;
        }

        .search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: #0A1628;
        }

        .search-bar input::placeholder {
          color: #9CA3AF;
        }

        /* Ships Grid */
        .ships-grid {
          padding: 32px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          flex: 1;
          overflow-y: auto;
        }

        .ship-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .ship-card:hover {
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .card-header {
          height: 160px;
          background: linear-gradient(135deg, #1e3a5f 0%, #0f2238 100%);
          position: relative;
        }

        .ship-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ship-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-image {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #90E0EF;
        }

        .card-content {
          padding: 20px;
        }

        .card-content h3 {
          font-size: 18px;
          font-weight: 600;
          color: #0A1628;
          margin-bottom: 4px;
        }

        .cruise-line {
          font-size: 14px;
          color: #64748B;
          margin-bottom: 16px;
        }

        .ship-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px 0;
          border-top: 1px solid #F1F5F9;
          border-bottom: 1px solid #F1F5F9;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 14px;
        }

        .usage-info {
          display: flex;
          justify-content: space-between;
          padding: 16px 0;
          font-size: 14px;
        }

        .usage-label {
          color: #64748B;
        }

        .usage-count {
          font-weight: 600;
          color: #0A1628;
        }

        .card-actions {
          display: flex;
          gap: 8px;
        }

        .card-actions button {
          flex: 1;
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
          .ships-grid {
            grid-template-columns: 1fr;
            padding: 16px;
          }

          .top-bar {
            padding: 0 16px;
          }

          .search-section {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}