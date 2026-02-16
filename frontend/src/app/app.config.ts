import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import {
  Layers, LayoutDashboard, Folder, FolderOpen,
  ChevronRight, ChevronDown, LogOut, Sun, Moon,
  Eye, EyeOff, Plus, Ellipsis, Pencil, Trash2,
  Lock, Save, Upload, Sparkles, Check, X,
  RefreshCw, Loader, FileText, File, FilePlus, Download, Printer,
  Users, Shield, Mail, Square,
} from 'lucide-angular';

import { routes } from './app.routes';

const icons = {
  Layers, LayoutDashboard, Folder, FolderOpen,
  ChevronRight, ChevronDown, LogOut, Sun, Moon,
  Eye, EyeOff, Plus, Ellipsis, Pencil, Trash2,
  Lock, Save, Upload, Sparkles, Check, X,
  RefreshCw, Loader, FileText, File, FilePlus, Download, Printer,
  Users, Shield, Mail, Square,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) },
  ]
};
