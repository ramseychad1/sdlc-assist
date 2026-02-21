import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, HttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import {
  Layers, LayoutDashboard, Folder, FolderOpen,
  ChevronRight, ChevronDown, LogOut, Sun, Moon,
  Eye, EyeOff, Plus, Ellipsis, Pencil, Trash2,
  Lock, Save, Upload, Sparkles, Check, X,
  RefreshCw, Loader, FileText, File, FilePlus, Download, Printer,
  Users, Shield, Mail, Square,
  AlertCircle, PackageOpen, Palette, Blocks, CheckCircle,
  Cpu, Database, Code2, GitBranch, BookOpen, Info, FileUp, RefreshCcw,
  ScanSearch, CircleCheck, CircleCheckBig, LoaderCircle,
  Inbox, List, SquarePen, Settings, ChartBar, Wand, ArrowRight,
  ExternalLink, Maximize2,
  PanelLeftClose, PanelLeftOpen,
  TriangleAlert, Wrench, ArrowLeft, LayoutTemplate,
} from 'lucide-angular';
import { provideMarkdown } from 'ngx-markdown';

import { routes } from './app.routes';

const icons = {
  Layers, LayoutDashboard, Folder, FolderOpen,
  ChevronRight, ChevronDown, LogOut, Sun, Moon,
  Eye, EyeOff, Plus, Ellipsis, Pencil, Trash2,
  Lock, Save, Upload, Sparkles, Check, X,
  RefreshCw, Loader, FileText, File, FilePlus, Download, Printer,
  Users, Shield, Mail, Square,
  AlertCircle, PackageOpen, Palette, Blocks, CheckCircle,
  Cpu, Database, Code2, GitBranch, BookOpen, Info, FileUp, RefreshCcw,
  ScanSearch, CircleCheck, CircleCheckBig, LoaderCircle,
  Inbox, List, SquarePen, Settings, ChartBar, Wand, ArrowRight,
  ExternalLink, Maximize2,
  PanelLeftClose, PanelLeftOpen,
  TriangleAlert, Wrench, ArrowLeft, LayoutTemplate,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) },
    provideMarkdown({ loader: HttpClient }),
  ]
};
