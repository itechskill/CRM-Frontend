import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { 
  CheckSquare, 
  Clock, 
  Tag, 
  Calendar, 
  MessageSquare, 
  Plus, 
  LayoutGrid, 
  List, 
  Search, 
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import './EmployeeTasksView.css';

export default function EmployeeTasksView({ onOpenNewTaskModal }) {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const mapBackendStatusToCol = (status) => {
    if (status === 'Completed') return 'completed';
    if (status === 'In Progress' || status === 'Under Review') return 'in_progress';
    return 'todo';
  };

  const mapColToBackendStatus = (col) => {
    if (col === 'completed') return 'Completed';
    if (col === 'in_progress') return 'In Progress';
    return 'Pending';
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/tasks');
      if (response.ok && data.success && Array.isArray(data.data)) {
        setTasks(data.data.map(t => ({
          ...t,
          id: t._id,
          column: mapBackendStatusToCol(t.status),
          logged: `${t.hoursLogged || 0}h`,
          estimated: '4.0h',
          subtasks: t.status === 'Completed' ? '1/1' : '0/1',
          commentsCount: 0,
          dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date'
        })));
      }
    } catch (err) {
      console.error('Fetch employee tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const columns = [
    { id: 'todo', title: 'To Do / Pending', color: '#64748B' },
    { id: 'in_progress', title: 'In Progress', color: '#3B82F6' },
    { id: 'completed', title: 'Completed', color: '#10B981' }
  ];

  const moveTask = async (taskId, targetColumn) => {
    const newStatus = mapColToBackendStatus(targetColumn);
    setTasks(tasks.map(t => t.id === taskId ? { ...t, column: targetColumn, status: newStatus } : t));
    await apiRequest(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
  };

  const filteredTasks = tasks.filter(t => 
    (t.title || '').toLowerCase().includes((search || '').toLowerCase()) || 
    (t.project || '').toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="employee-tasks-container">
      {/* Top Controls Bar */}
      <div className="tasks-header-bar">
        <div className="tasks-search-box">
          <Search size={16} color="#94A3B8" />
          <input 
            type="text" 
            placeholder="Filter tasks by name or project..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="tasks-right-controls">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Board View"
            >
              <LayoutGrid size={16} />
              <span>Board</span>
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={16} />
              <span>List</span>
            </button>
          </div>

          <button className="add-task-btn" onClick={onOpenNewTaskModal}>
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* View 1: Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="kanban-board-grid">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.column === col.id);
            return (
              <div key={col.id} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="column-title-box">
                    <span className="column-dot" style={{ backgroundColor: col.color }} />
                    <span className="column-name">{col.title}</span>
                    <span className="column-count">{colTasks.length}</span>
                  </div>
                </div>

                <div className="kanban-cards-list">
                  {colTasks.map(task => (
                    <div key={task.id} className="kanban-card">
                      <div className="card-project-row">
                        <span className="task-project-pill">{task.project || 'General'}</span>
                        <span className={`priority-tag ${(task.priority || 'medium').toLowerCase()}`}>
                          {task.priority || 'Medium'}
                        </span>
                      </div>

                      <h4 className="kanban-task-title">{task.title}</h4>

                      <div className="kanban-task-meta">
                        <div className="meta-item">
                          <Clock size={13} />
                          <span>{task.logged} / {task.estimated}</span>
                        </div>
                        <div className="meta-item">
                          <CheckSquare size={13} />
                          <span>{task.subtasks}</span>
                        </div>
                        <div className="meta-item">
                          <MessageSquare size={13} />
                          <span>{task.commentsCount}</span>
                        </div>
                      </div>

                      <div className="kanban-card-footer">
                        <span className="task-due-tag">
                          <Calendar size={12} />
                          {task.dueDate}
                        </span>

                        {/* Move Column Selector */}
                        <select 
                          className="move-select"
                          value={task.column}
                          onChange={(e) => moveTask(task.id, e.target.value)}
                        >
                          <option value="todo">Move: To Do</option>
                          <option value="in_progress">Move: In Progress</option>
                          <option value="in_review">Move: In Review</option>
                          <option value="completed">Move: Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View 2: List View */}
      {viewMode === 'list' && (
        <div className="tasks-list-table-container">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task Description</th>
                <th>Project</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Hours</th>
                <th>Subtasks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr key={task.id}>
                  <td className="task-name-cell">
                    <span className="task-table-title">{task.title}</span>
                  </td>
                  <td>
                    <span className="task-project-pill">{task.project}</span>
                  </td>
                  <td>
                    <span className={`priority-tag ${(task.priority || 'medium').toLowerCase()}`}>
                      {task.priority || 'Medium'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${task.column || 'todo'}`}>
                      {(task.column || 'todo').replace('_', ' ')}
                    </span>
                  </td>
                  <td>{task.dueDate}</td>
                  <td>{task.logged} / {task.estimated}</td>
                  <td>{task.subtasks}</td>
                  <td>
                    <select 
                      className="table-move-select"
                      value={task.column}
                      onChange={(e) => moveTask(task.id, e.target.value)}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
