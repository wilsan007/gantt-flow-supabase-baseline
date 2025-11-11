#!/usr/bin/env python3
"""
🎨 Script de modernisation sécurisé des dialogs
Applique withUniversalDialog sans casser les fichiers
"""

import re
import sys
from pathlib import Path

def modernize_dialog(filepath: Path, module: str) -> bool:
    """Modernise un dialog en ajoutant withUniversalDialog"""
    
    try:
        content = filepath.read_text()
        original_content = content
        
        # Chercher le nom du dialog depuis le fichier
        dialog_name = filepath.stem
        
        # 1. Ajouter l'import si absent
        if "withUniversalDialog" not in content:
            # Trouver où ajouter l'import (après le dernier import de @/components/ui/dialog)
            dialog_import_pattern = r"(import.*from '@/components/ui/dialog';)"
            if re.search(dialog_import_pattern, content):
                content = re.sub(
                    dialog_import_pattern,
                    r"\1\nimport { withUniversalDialog } from '@/components/ui/universal-dialog';",
                    content,
                    count=1
                )
        
        # 2. Modifier l'export principal
        #    Chercher: export const DialogName = ... 
        #             export const DialogName: React.FC<Props> = ...
        #             export function DialogName(...
        
        # Pattern général : capture tout entre "export const DialogName" et "= ("
        export_pattern = rf"^export const ({dialog_name})(.*?=\s*\()"
        
        if re.search(export_pattern, content, re.MULTILINE | re.DOTALL):
            # Remplacer export const DialogName par const DialogNameBase
            content = re.sub(
                export_pattern,
                rf"const \1Base\2",
                content,
                count=1,
                flags=re.MULTILINE | re.DOTALL
            )
        # Pattern function
        elif re.search(rf"^export function {dialog_name}\s*\(", content, re.MULTILINE):
            content = re.sub(
                rf"^export function {dialog_name}\s*\(",
                f"function {dialog_name}Base(",
                content,
                count=1,
                flags=re.MULTILINE
            )
        else:
            print(f"  ⚠️  Pattern export non trouvé dans {filepath.name}")
            return False
        
        # 3. Ajouter le HOC export à la fin si absent
        hoc_export = f"\n// 🎨 Export avec support mobile automatique + thème {module.title()}\nexport const {dialog_name} = withUniversalDialog('{module}', {dialog_name}Base);\n"
        
        if f"withUniversalDialog('{module}', {dialog_name}Base)" not in content:
            content = content.rstrip() + hoc_export
        
        # 4. Sauvegarder si changé
        if content != original_content:
            filepath.write_text(content)
            return True
        
        return False
        
    except Exception as e:
        print(f"  ❌ Erreur: {e}")
        return False


def main():
    """Modernise tous les dialogs"""
    
    dialogs = [
        # HR - 7 dialogs
        ("src/components/hr/CreateEvaluationDialog.tsx", "hr"),
        ("src/components/hr/RemoteWorkRequestDialog.tsx", "hr"),
        ("src/components/hr/AbsenceJustificationDialog.tsx", "hr"),
        ("src/components/hr/AdministrativeRequestDialog.tsx", "hr"),
        ("src/components/hr/AlertDetailDialog.tsx", "hr"),
        ("src/components/hr/CreateObjectiveDialog.tsx", "hr"),
        ("src/components/hr/EmployeeDetailsDialog.tsx", "hr"),
        
        # Vues/dialogs - 3 dialogs
        ("src/components/vues/dialogs/TaskCreationDialog.tsx", "tasks"),
        ("src/components/vues/dialogs/TaskEditDialog.tsx", "tasks"),
        ("src/components/vues/dialogs/TaskDetailsDialog.tsx", "tasks"),
        
        # Vues/table - 2 dialogs
        ("src/components/vues/table/ActionCreationDialog.tsx", "tasks"),
        ("src/components/vues/table/SubtaskCreationDialog.tsx", "tasks"),
        
        # Tasks - 3 dialogs
        ("src/components/tasks/ModernTaskCreationDialog.tsx", "tasks"),
        ("src/components/tasks/ModernTaskEditDialog.tsx", "tasks"),
        ("src/components/tasks/TemplateManagementDialog.tsx", "tasks"),
        
        # Operations - 2 dialogs
        ("src/components/operations/ActivityDetailDialog.tsx", "operations"),
        ("src/components/operations/OneOffActivityDialog.tsx", "operations"),
        
        # Admin - 1 dialog
        ("src/components/admin/RoleManagementDialog.tsx", "admin"),
    ]
    
    print("🎨 Modernisation sécurisée des dialogs...")
    print()
    
    success_count = 0
    skip_count = 0
    error_count = 0
    
    for filepath_str, module in dialogs:
        filepath = Path(filepath_str)
        
        if not filepath.exists():
            print(f"❌ {filepath.name}: Fichier non trouvé")
            error_count += 1
            continue
        
        print(f"📝 {filepath.name}...", end=" ")
        
        if modernize_dialog(filepath, module):
            print("✅ Modernisé")
            success_count += 1
        else:
            print("⏭️  Skip (déjà fait ou erreur)")
            skip_count += 1
    
    print()
    print(f"🎉 Terminé: {success_count} modernisés, {skip_count} skip, {error_count} erreurs")
    
    return 0 if error_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
