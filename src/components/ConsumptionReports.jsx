import React, { useState, useEffect } from 'react';
import {
  FileText,
  BookOpen,
  Calendar,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { menuService, recipeService, reportsService, inventoryService } from '../services/api';

const ConsumptionReports = () => {
  const [activeTab, setActiveTab] = useState('tally'); // 'tally' or 'recipes'
  
  // Tally state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  
  // Recipe state
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (activeTab === 'tally') {
      fetchConsumptionReport();
    }
  }, [selectedDate, activeTab]);

  useEffect(() => {
    if (activeTab === 'recipes' && selectedMenuItem) {
      fetchRecipeForMenu();
    } else {
      setRecipeIngredients([]);
    }
  }, [selectedMenuItem, activeTab]);

  const fetchMenuItems = async () => {
    try {
      const data = await menuService.getItems();
      setMenuItems(data);
    } catch (err) {
      console.error('Failed to fetch menu items', err);
    }
  };

  const fetchConsumptionReport = async () => {
    try {
      setLoadingReport(true);
      const data = await reportsService.getConsumptionReport(selectedDate);
      setReportData(data);
    } catch (err) {
      console.error('Failed to fetch consumption report', err);
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchRecipeForMenu = async () => {
    try {
      setLoadingRecipes(true);
      const data = await recipeService.getRecipes(selectedMenuItem);
      setRecipeIngredients(data);
    } catch (err) {
      console.error('Failed to fetch recipes', err);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleAddIngredientRow = () => {
    setRecipeIngredients([...recipeIngredients, { inventory_item_name: '', quantity: 0, unit: 'g' }]);
  };

  const handleRemoveIngredientRow = (index) => {
    const newIngredients = [...recipeIngredients];
    newIngredients.splice(index, 1);
    setRecipeIngredients(newIngredients);
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...recipeIngredients];
    newIngredients[index][field] = value;
    setRecipeIngredients(newIngredients);
  };

  const handleSaveRecipe = async () => {
    if (!selectedMenuItem) return;
    
    // Validate
    const validIngredients = recipeIngredients.filter(ing => ing.inventory_item_name.trim() !== '' && ing.quantity > 0);
    
    try {
      setSavingRecipe(true);
      await recipeService.updateRecipe({
        menu_item_id: parseInt(selectedMenuItem),
        ingredients: validIngredients
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchRecipeForMenu();
    } catch (err) {
      console.error('Failed to save recipe', err);
      alert('Failed to save recipe');
    } finally {
      setSavingRecipe(false);
    }
  };

  return (
    <div className="admin-page-mobile-wrapper page-container">
      <div className="page-header flex-center-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="desktop-only">
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Consumption Reports</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Compare theoretical vs actual ingredient usage.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('tally')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #eaeaea',
              background: activeTab === 'tally' ? 'var(--primary)' : 'white',
              color: activeTab === 'tally' ? 'white' : '#333333',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={16} /> Daily Tally
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #eaeaea',
              background: activeTab === 'recipes' ? 'var(--primary)' : 'white',
              color: activeTab === 'recipes' ? 'white' : '#333333',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookOpen size={16} /> Manage Recipes
          </button>
        </div>
      </div>

      {activeTab === 'tally' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} color="var(--primary)" />
              Daily Inventory Tally
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>Report Date:</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #eaeaea',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333333',
                  background: '#f9fafb'
                }}
              />
            </div>
          </div>

          {loadingReport ? (
            <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><Loader2 size={32} className="animate-spin text-gray-400" /></div>
          ) : reportData ? (
            <div>
              <div style={{ marginBottom: '24px', background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#666' }}>Items Sold on {selectedDate}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {reportData.items_sold.length > 0 ? reportData.items_sold.map(item => (
                    <span key={item.id} style={{ background: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', border: '1px solid #eaeaea' }}>
                      {item.name}: <strong style={{ color: 'var(--primary)' }}>{item.quantity}</strong>
                    </span>
                  )) : (
                    <span style={{ fontSize: '14px', color: '#888' }}>No sales data for this date.</span>
                  )}
                </div>
              </div>

              <div className="scroll-x" style={{ background: 'white', border: '1px solid #eaeaea', borderRadius: '12px', marginTop: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead style={{ borderBottom: '1px solid #eaeaea', background: '#f9fafb' }}>
                    <tr>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Ingredient</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Theoretical Cons. (POS)</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Actual Cons. (Inventory)</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Variance</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.tally.length > 0 ? reportData.tally.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eaeaea', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '16px 24px', fontWeight: '600', fontSize: '14px', color: '#111' }}>{row.ingredient_name}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#4B5563' }}>{row.theoretical_consumption.toFixed(2)} {row.unit}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#4B5563' }}>{row.actual_consumption.toFixed(2)} {row.unit}</td>
                        <td style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: row.variance === 0 ? '#16a34a' : row.variance > 0 ? '#d97706' : '#dc2626' }}>
                          {row.variance > 0 ? '+' : ''}{row.variance.toFixed(2)} {row.unit}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          {row.variance === 0 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f0fdf4', color: '#16a34a', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}><CheckCircle2 size={12} /> Perfect Match</span>
                          ) : Math.abs(row.variance) <= (row.theoretical_consumption * 0.1) ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fef3c7', color: '#d97706', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}><TrendingUp size={12} /> Acceptable</span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fff0f0', color: '#dc2626', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}><AlertTriangle size={12} /> High Variance</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '32px 24px', color: '#888', fontSize: '14px' }}>No consumption data to display for this date. Make sure you have formulas mapped and an inventory sheet uploaded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
             <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Failed to load report data.</div>
          )}
        </div>
      )}

      {activeTab === 'recipes' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <BookOpen size={20} color="var(--primary)" />
              Recipe Formula Editor
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Map menu items to their raw inventory ingredients and consumption quantities.</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Select Menu Item to Edit:</label>
            <select
              value={selectedMenuItem}
              onChange={(e) => setSelectedMenuItem(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #eaeaea',
                outline: 'none',
                fontSize: '14px',
                color: '#333333'
              }}
            >
              <option value="">-- Select Menu Item --</option>
              {menuItems.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          {selectedMenuItem && (
            <div>
              <div className="scroll-x" style={{ background: 'white', border: '1px solid #eaeaea', borderRadius: '12px', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ borderBottom: '1px solid #eaeaea', background: '#f9fafb' }}>
                    <tr>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', width: '50%' }}>Ingredient Name (Matches Inventory)</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', width: '25%' }}>Quantity / order</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', width: '15%' }}>Unit</th>
                      <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', width: '10%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRecipes ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px' }}><Loader2 className="animate-spin text-gray-400" /></td></tr>
                    ) : recipeIngredients.map((ing, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eaeaea', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '12px 24px' }}>
                          <input 
                            type="text" 
                            value={ing.inventory_item_name}
                            onChange={(e) => handleIngredientChange(idx, 'inventory_item_name', e.target.value)}
                            placeholder="e.g. Dosai Rice"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eaeaea', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = '#eaeaea'}
                          />
                        </td>
                        <td style={{ padding: '12px 24px' }}>
                          <input 
                            type="number" 
                            step="0.1"
                            value={ing.quantity}
                            onChange={(e) => handleIngredientChange(idx, 'quantity', parseFloat(e.target.value))}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eaeaea', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = '#eaeaea'}
                          />
                        </td>
                        <td style={{ padding: '12px 24px' }}>
                          <select 
                            value={ing.unit}
                            onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eaeaea', outline: 'none', background: 'white', fontSize: '14px', transition: 'border-color 0.2s', cursor: 'pointer' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = '#eaeaea'}
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="L">L</option>
                            <option value="units">units</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                          <button onClick={() => handleRemoveIngredientRow(idx)} style={{ background: '#fff0f0', border: '1px solid #ffd6d6', color: '#ff4d4d', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#ff4d4d'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.color = '#ff4d4d'; }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!loadingRecipes && recipeIngredients.length === 0) && (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px 24px', color: '#888', fontSize: '14px' }}>No ingredients mapped yet. Add your first ingredient below!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={handleAddIngredientRow}
                  style={{
                    background: 'white',
                    color: 'var(--primary)',
                    border: '1px dashed var(--primary)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} /> Add Ingredient
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {saveSuccess && <span style={{ color: '#16a34a', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={16} /> Saved Successfully!</span>}
                  <button
                    onClick={handleSaveRecipe}
                    disabled={savingRecipe}
                    style={{
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      opacity: savingRecipe ? 0.7 : 1
                    }}
                  >
                    {savingRecipe ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Formula
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsumptionReports;
