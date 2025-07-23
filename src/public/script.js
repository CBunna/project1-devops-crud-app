class TaskManager {
    constructor() {
        this.editingId = null;
        this.init();
    }

    init() {
        this.taskForm = document.getElementById('taskForm');
        this.taskIdField = document.getElementById('taskId');
        this.titleField = document.getElementById('title');
        this.descriptionField = document.getElementById('description');
        this.submitBtn = document.getElementById('submitBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.tasksContainer = document.getElementById('tasksContainer');

        this.taskForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.cancelBtn.addEventListener('click', () => this.cancelEdit());

        this.loadTasks();
    }

    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            const tasks = await response.json();
            this.renderTasks(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasksContainer.innerHTML = '<p>Error loading tasks</p>';
        }
    }

    renderTasks(tasks) {
        if (tasks.length === 0) {
            this.tasksContainer.innerHTML = '<p>No tasks yet. Create your first task!</p>';
            return;
        }

        this.tasksContainer.innerHTML = tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-title">
                    ${this.escapeHtml(task.title)}
                    <span class="status-badge ${task.completed ? 'status-completed' : 'status-pending'}">
                        ${task.completed ? 'Completed' : 'Pending'}
                    </span>
                </div>
                ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    Created: ${new Date(task.created_at).toLocaleString()}
                    ${task.updated_at !== task.created_at ? `<br>Updated: ${new Date(task.updated_at).toLocaleString()}` : ''}
                </div>
                <div class="task-actions">
                    <button data-action="toggle" data-id="${task.id}" data-completed="${!task.completed}">
                        ${task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                    </button>
                    <button class="edit" data-action="edit" data-id="${task.id}">Edit</button>
                    <button class="delete" data-action="delete" data-id="${task.id}">Delete</button>
                </div>
            </div>
        `).join('');

        // Add event listeners to buttons
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Remove existing event listeners to prevent duplicates
        const buttons = this.tasksContainer.querySelectorAll('button[data-action]');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                const id = parseInt(e.target.getAttribute('data-id'));
                
                switch(action) {
                    case 'toggle':
                        const completed = e.target.getAttribute('data-completed') === 'true';
                        this.toggleComplete(id, completed);
                        break;
                    case 'edit':
                        this.editTask(id);
                        break;
                    case 'delete':
                        this.deleteTask(id);
                        break;
                }
            });
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const title = this.titleField.value.trim();
        const description = this.descriptionField.value.trim();

        if (!title) {
            alert('Title is required');
            return;
        }

        try {
            let response;
            if (this.editingId) {
                // Update existing task
                const currentTask = await this.getTask(this.editingId);
                response = await fetch(`/api/tasks/${this.editingId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        completed: currentTask.completed
                    })
                });
            } else {
                // Create new task
                response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title, description })
                });
            }

            if (response.ok) {
                this.resetForm();
                this.loadTasks();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Error saving task');
        }
    }

    async editTask(id) {
        try {
            const task = await this.getTask(id);
            if (task) {
                this.editingId = id;
                this.titleField.value = task.title;
                this.descriptionField.value = task.description || '';
                this.submitBtn.textContent = 'Update Task';
                this.cancelBtn.style.display = 'inline-block';
                this.titleField.focus();
            }
        } catch (error) {
            console.error('Error loading task for edit:', error);
            alert('Error loading task');
        }
    }

    async getTask(id) {
        const response = await fetch(`/api/tasks/${id}`);
        return await response.json();
    }

    async toggleComplete(id, completed) {
        try {
            const task = await this.getTask(id);
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: task.title,
                    description: task.description,
                    completed
                })
            });

            if (response.ok) {
                this.loadTasks();
            } else {
                alert('Error updating task status');
            }
        } catch (error) {
            console.error('Error toggling task:', error);
            alert('Error updating task');
        }
    }

    async deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.loadTasks();
            } else {
                alert('Error deleting task');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Error deleting task');
        }
    }

    cancelEdit() {
        this.resetForm();
    }

    resetForm() {
        this.editingId = null;
        this.taskForm.reset();
        this.submitBtn.textContent = 'Add Task';
        this.cancelBtn.style.display = 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
const taskManager = new TaskManager();
