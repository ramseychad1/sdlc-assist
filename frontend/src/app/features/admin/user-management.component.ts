import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { HeaderComponent, Breadcrumb } from '../../shared/components/header.component';
import { AdminService, UserResponse, CreateUserRequest, UpdateUserRequest } from '../../core/services/admin.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, HeaderComponent],
  template: `
    <app-header [breadcrumbs]="breadcrumbs"></app-header>
    <main class="content">
      <div class="page-header">
        <div>
          <h1 class="page-title">User Management</h1>
          <p class="page-subtitle">Create and manage user accounts for SDLC Assist</p>
        </div>
        <button class="btn btn-primary" (click)="showCreateForm = !showCreateForm">
          <lucide-icon name="plus" [size]="16"></lucide-icon>
          <span>Create User</span>
        </button>
      </div>

      @if (showCreateForm) {
        <div class="card create-form">
          <h3 class="form-title">New User</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input
                class="form-input"
                [class.input-error]="submitted && !newUser.username.trim()"
                [(ngModel)]="newUser.username"
                autocomplete="off"
              />
              @if (submitted && !newUser.username.trim()) {
                <span class="field-error">Username is required</span>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input
                class="form-input"
                type="text"
                [class.input-error]="submitted && !newUser.password"
                [(ngModel)]="newUser.password"
                autocomplete="off"
              />
              @if (submitted && !newUser.password) {
                <span class="field-error">Password is required</span>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Display Name</label>
              <input
                class="form-input"
                [class.input-error]="submitted && !newUser.displayName.trim()"
                [(ngModel)]="newUser.displayName"
                autocomplete="off"
              />
              @if (submitted && !newUser.displayName.trim()) {
                <span class="field-error">Display name is required</span>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <select class="form-input" [(ngModel)]="newUser.role">
                <option value="ADMIN">Admin</option>
                <option value="PRODUCT_MANAGER">Product Manager</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Email <span class="optional-hint">(invite will be sent)</span></label>
              <input
                class="form-input"
                type="email"
                [(ngModel)]="newUser.email"
                autocomplete="off"
              />
            </div>
          </div>
          @if (createError) {
            <p class="error-text">{{ createError }}</p>
          }
          <div class="form-actions">
            <button class="btn btn-ghost" (click)="cancelCreate()">Cancel</button>
            <button class="btn btn-primary" (click)="createUser()" [disabled]="creating">
              @if (creating) {
                <lucide-icon name="loader" [size]="16" class="spin"></lucide-icon>
              }
              <span>Save</span>
            </button>
          </div>
        </div>
      }

      <div class="card">
        @if (loading) {
          <div class="loading">
            <lucide-icon name="loader" [size]="20" class="spin"></lucide-icon>
            <span>Loading users...</span>
          </div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Display Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (user of users; track user.id) {
                <tr>
                  <td class="username-cell">{{ user.username }}</td>
                  <td>{{ user.displayName }}</td>
                  <td class="email-cell">{{ user.email || '—' }}</td>
                  <td>
                    <span class="role-badge" [class]="'role-' + user.role.toLowerCase()">
                      {{ formatRole(user.role) }}
                    </span>
                  </td>
                  <td class="date-cell">{{ user.createdAt | date: 'mediumDate' }}</td>
                  <td class="action-cell">
                    <button class="btn btn-ghost btn-icon" (click)="startEditUser(user)" title="Edit user">
                      <lucide-icon name="pencil" [size]="16"></lucide-icon>
                    </button>
                    <button class="btn btn-ghost btn-icon btn-danger" (click)="deleteUser(user)" title="Delete user">
                      <lucide-icon name="trash-2" [size]="16"></lucide-icon>
                    </button>
                  </td>
                </tr>
                @if (editingUserId === user.id) {
                  <tr class="edit-row">
                    <td colspan="6">
                      <div class="edit-form">
                        <h4 class="edit-title">Edit {{ user.username }}</h4>
                        <div class="edit-grid">
                          <div class="form-group">
                            <label class="form-label">Display Name</label>
                            <input
                              class="form-input"
                              [class.input-error]="editSubmitted && !editUser.displayName.trim()"
                              [(ngModel)]="editUser.displayName"
                              autocomplete="off"
                            />
                            @if (editSubmitted && !editUser.displayName.trim()) {
                              <span class="field-error">Display name is required</span>
                            }
                          </div>
                          <div class="form-group">
                            <label class="form-label">Role</label>
                            <select class="form-input" [(ngModel)]="editUser.role">
                              <option value="ADMIN">Admin</option>
                              <option value="PRODUCT_MANAGER">Product Manager</option>
                              <option value="VIEWER">Viewer</option>
                            </select>
                          </div>
                          <div class="form-group">
                            <label class="form-label">New Password <span class="optional-hint">(leave blank to keep current)</span></label>
                            <input
                              class="form-input"
                              type="text"
                              [(ngModel)]="editUser.password"
                              autocomplete="off"
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                        @if (editError) {
                          <span class="field-error">{{ editError }}</span>
                        }
                        @if (editSuccess) {
                          <span class="success-text">User updated successfully</span>
                        }
                        <div class="edit-actions">
                          <button class="btn btn-ghost btn-sm" (click)="cancelEdit()">Cancel</button>
                          <button class="btn btn-primary btn-sm" (click)="saveUser()" [disabled]="savingEdit">
                            @if (savingEdit) {
                              <lucide-icon name="loader" [size]="14" class="spin"></lucide-icon>
                            } @else {
                              <lucide-icon name="save" [size]="14"></lucide-icon>
                            }
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        }
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }

      .content {
        flex: 1;
        padding: 32px;
        overflow-y: auto;
        max-width: 960px;
        margin: 0 auto;
        width: 100%;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      .page-title {
        font-size: 24px;
        font-weight: 600;
        color: var(--foreground);
        margin: 0;
      }

      .page-subtitle {
        font-size: 14px;
        color: var(--muted-foreground);
        margin: 4px 0 0;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 0;
        margin-bottom: 16px;
      }

      .create-form {
        padding: 24px;
      }

      .form-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--foreground);
        margin: 0 0 16px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .form-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--foreground);
      }

      .form-input {
        height: 36px;
        padding: 0 12px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--background);
        color: var(--foreground);
        font-size: 14px;
        outline: none;
      }

      .form-input:focus {
        border-color: var(--ring);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--ring) 25%, transparent);
      }

      .form-input.input-error {
        border-color: var(--destructive);
      }

      .field-error {
        font-size: 12px;
        color: var(--destructive);
      }

      .optional-hint {
        font-weight: 400;
        color: var(--muted-foreground);
      }

      .error-text {
        color: var(--destructive);
        font-size: 13px;
        margin: 12px 0 0;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
      }

      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 32px;
        color: var(--muted-foreground);
        font-size: 14px;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
      }

      .table th {
        text-align: left;
        padding: 12px 16px;
        font-size: 13px;
        font-weight: 500;
        color: var(--muted-foreground);
        border-bottom: 1px solid var(--border);
      }

      .table td {
        padding: 12px 16px;
        font-size: 14px;
        color: var(--foreground);
        border-bottom: 1px solid var(--border);
      }

      .table tr:last-child td {
        border-bottom: none;
      }

      .username-cell {
        font-weight: 500;
      }

      .email-cell {
        color: var(--muted-foreground);
        font-size: 13px;
      }

      .date-cell {
        color: var(--muted-foreground);
      }

      .action-cell {
        width: 80px;
        text-align: right;
        white-space: nowrap;
      }

      .edit-row td {
        padding: 0 16px 12px;
        border-bottom: 1px solid var(--border);
      }

      .edit-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        background: var(--background);
        border-radius: var(--radius);
        border: 1px solid var(--border);
      }

      .edit-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--foreground);
        margin: 0;
      }

      .edit-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
      }

      .edit-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 4px;
      }

      .btn-sm {
        height: 32px;
        padding: 0 12px;
        font-size: 13px;
      }

      .success-text {
        font-size: 12px;
        color: var(--primary);
      }

      .role-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: var(--radius-full);
        font-size: 12px;
        font-weight: 500;
      }

      .role-admin {
        background: color-mix(in srgb, var(--destructive) 15%, transparent);
        color: var(--destructive);
      }

      .role-product_manager {
        background: color-mix(in srgb, var(--primary) 15%, transparent);
        color: var(--primary);
      }

      .role-viewer {
        background: color-mix(in srgb, var(--muted-foreground) 15%, transparent);
        color: var(--muted-foreground);
      }

      .btn-danger:hover {
        color: var(--destructive);
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class UserManagement implements OnInit {
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'User Management' },
  ];

  users: UserResponse[] = [];
  loading = true;
  showCreateForm = false;
  creating = false;
  createError = '';
  submitted = false;

  editingUserId: string | null = null;
  editUser: UpdateUserRequest = {
    displayName: '',
    role: 'VIEWER',
    password: '',
  };
  savingEdit = false;
  editSubmitted = false;
  editError = '';
  editSuccess = false;

  newUser: CreateUserRequest = {
    username: '',
    password: '',
    displayName: '',
    role: 'VIEWER',
    email: '',
  };

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: users => {
        this.users = users;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  createUser(): void {
    this.submitted = true;
    this.createError = '';
    if (!this.newUser.username.trim() || !this.newUser.password || !this.newUser.displayName.trim()) {
      return;
    }

    this.creating = true;
    this.adminService.createUser(this.newUser).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateForm = false;
        this.submitted = false;
        this.resetForm();
        this.cdr.markForCheck();
        this.loadUsers();
      },
      error: err => {
        this.creating = false;
        this.createError = err.status === 409 ? 'Username already exists.' : 'Failed to create user.';
        this.cdr.markForCheck();
      },
    });
  }

  deleteUser(user: UserResponse): void {
    if (!confirm(`Delete user "${user.displayName}"? This cannot be undone.`)) {
      return;
    }

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
    });
  }

  startEditUser(user: UserResponse): void {
    if (this.editingUserId === user.id) {
      this.editingUserId = null;
      return;
    }

    this.editingUserId = user.id;
    this.editUser = {
      displayName: user.displayName,
      role: user.role,
      password: '',
    };
    this.editSubmitted = false;
    this.editError = '';
    this.editSuccess = false;
  }

  saveUser(): void {
    this.editSubmitted = true;
    this.editError = '';
    this.editSuccess = false;

    if (!this.editUser.displayName.trim()) {
      return;
    }

    this.savingEdit = true;
    const request: UpdateUserRequest = {
      displayName: this.editUser.displayName,
      role: this.editUser.role,
    };

    // Only include password if it was provided
    if (this.editUser.password && this.editUser.password.trim()) {
      request.password = this.editUser.password;
    }

    this.adminService.updateUser(this.editingUserId!, request).subscribe({
      next: updatedUser => {
        this.savingEdit = false;
        this.editSuccess = true;
        this.editSubmitted = false;
        this.cdr.markForCheck();

        // Update the user in the list
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }

        // Close the edit form after a brief delay
        setTimeout(() => {
          this.cancelEdit();
        }, 1500);
      },
      error: () => {
        this.savingEdit = false;
        this.editError = 'Failed to update user.';
        this.cdr.markForCheck();
      },
    });
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.editUser = {
      displayName: '',
      role: 'VIEWER',
      password: '',
    };
    this.editSubmitted = false;
    this.editError = '';
    this.editSuccess = false;
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.createError = '';
    this.submitted = false;
    this.resetForm();
  }

  formatRole(role: string): string {
    return role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private resetForm(): void {
    this.newUser = { username: '', password: '', displayName: '', role: 'VIEWER', email: '' };
  }
}
