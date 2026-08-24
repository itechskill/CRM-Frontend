import React, { useState } from 'react';
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

  const [tasks, setTasks] = useState([
    {
      id: 101,
      title: 'Implement Dark Mode Theme Toggle in FlowBridge UI',
      project: 'Proxima Migration',
      column: 'in_progress',
      priority: 'High',
      dueDate: 'Jun 16, 2024',
      logged: '3.5h',
      estimated: '5.0h',
      subtasks: '4/5',
      commentsCount: 3
    },
    {
      id: 102,
      title: 'Optimize API Response Parsing for Analytics Engine',
      project: 'TechFlow Engine',
      column: 'in_progress',
      priority: 'Critical',
      dueDate: 'Jun 17, 2024',
      logged: '2.0h',
      estimated: '6.0h',
      subtasks: '2/4',
      commentsCount: 5
    },
    {
      id: 103,
      title: 'Fix ERP OAuth Token Refresh Deadlock Bug',
      project: 'BuildCo Integration',
      column: 'todo',
      priority: 'High',
      dueDate: 'Jun 19, 2024',
      logged: '0h',
      estimated: '2.0h',
      subtasks: '0/2',
      commentsCount: 2
    },
    {
      id: 104,
      title: 'Refactor Security Audit Component Test Suite',
      project: 'Starlight Security',
      column: 'todo',
      priority: 'Medium',
      dueDate: 'Jun 20, 2024',
      logged: '0h',
      estimated: '3.5h',
      subtasks: '1/3',
      commentsCount: 1
    },
    {
      id: 105,
      title: 'UI Design Specs & Figma Tokens Sync',
      project: 'Proxima Migration',
      column: 'in_review',
      priority: 'Medium',
      dueDate: 'Jun 15, 2024',
      logged: '4.0h',
      estimated: '4.0h',
      subtasks: '3/3',
      commentsCount: 4
    },
    {
      id: 106,
      title: 'Setup React Router Navigation for Employee Portal',
      project: 'Proxima Migration',
      column: 'completed',
      priority: 'High',
      dueDate: 'Jun 14, 2024',
      logged: '6.0h',
      estimated: '6.0h',
      subtasks: '5/5',
      commentsCount: 6
    }
  ]);

  const columns = [
    { id: 'todo', title: 'To Do', color: '#64748B' },
    { id: 'in_progress', title: 'In Progress', color: '#2563EB' },
    { id: 'in_review', title: 'In Review', color: '#F59E0B' },
    { id: 'completed', title: 'Completed', color: '#10B981' }
  ];

  const moveTask = (taskId, targetColumn) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, column: targetColumn } : t));
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.project.toLowerCase().includes(search.toLowerCase())
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
                        <span className="task-project-pill">{task.project}</span>
                        <span className={`priority-tag ${task.priority.toLowerCase()}`}>
                          {task.priority}
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
                    <span className={`priority-tag ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${task.column}`}>
                      {task.column.replace('_', ' ')}
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
