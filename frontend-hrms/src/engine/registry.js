/**
 * Uabindia HRMS Metadata-Driven Component Registry
 * 
 * Controlled registry that maps metadata component types to React components.
 * Strictly prevents eval() or arbitrary code injection.
 */

import React from 'react'
import {
  User,
  Users,
  Building2,
  FolderKanban,
  CreditCard,
  Target,
  LogOut,
  CalendarDays,
  ShieldCheck,
  Landmark,
  Sliders,
  Award,
  AlignLeft,
  Briefcase,
  Clock,
  Laptop,
  CheckSquare,
  FileCheck2,
  Layers,
  Sparkles,
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Download,
  Printer,
  ChevronDown,
  ToggleLeft,
  Calendar,
  Hash,
  Type,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Settings2,
  Power,
} from 'lucide-react'

// Icon mapping dictionary
export const ICON_REGISTRY = {
  User,
  Users,
  Building2,
  FolderKanban,
  CreditCard,
  Target,
  LogOut,
  CalendarDays,
  ShieldCheck,
  Landmark,
  Sliders,
  Award,
  AlignLeft,
  Briefcase,
  Clock,
  Laptop,
  CheckSquare,
  FileCheck2,
  Layers,
  Sparkles,
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Download,
  Printer,
  ChevronDown,
  ToggleLeft,
  Calendar,
  Hash,
  Type,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Settings2,
  Power,
}

export function resolveIcon(iconName, defaultIcon = User) {
  if (!iconName) return defaultIcon
  if (typeof iconName !== 'string') return iconName
  return ICON_REGISTRY[iconName] || defaultIcon
}

// Internal registries
const FIELD_REGISTRY = {}
const COLUMN_REGISTRY = {}
const SECTION_REGISTRY = {}
const SPECIALIZED_REGISTRY = {}

/**
 * Register a specialized HR workflow component
 */
export function registerSpecializedComponent(name, component) {
  SPECIALIZED_REGISTRY[name] = component
}

export function getSpecializedComponent(name) {
  return SPECIALIZED_REGISTRY[name] || null
}

/**
 * Register a field renderer
 */
export function registerFieldRenderer(type, component) {
  FIELD_REGISTRY[type] = component
}

export function getFieldRenderer(type) {
  return FIELD_REGISTRY[type] || null
}

/**
 * Register a table column / cell formatter
 */
export function registerColumnRenderer(format, component) {
  COLUMN_REGISTRY[format] = component
}

export function getColumnRenderer(format) {
  return COLUMN_REGISTRY[format] || null
}

/**
 * Register a section layout
 */
export function registerSectionLayout(layout, component) {
  SECTION_REGISTRY[layout] = component
}

export function getSectionLayout(layout) {
  return SECTION_REGISTRY[layout] || null
}

export default {
  resolveIcon,
  registerFieldRenderer,
  getFieldRenderer,
  registerColumnRenderer,
  getColumnRenderer,
  registerSectionLayout,
  getSectionLayout,
  registerSpecializedComponent,
  getSpecializedComponent,
  ICON_REGISTRY,
}
