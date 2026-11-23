import difflib
from typing import Dict, Any, List

class ComparisonEngine:
    """Compares original vs revised medical device labels, highlights field changes,
    unified text differences, and detects altered statutory elements.
    """

    CRITICAL_REGULATORY_FIELDS = [
        "lot_number",
        "serial_number",
        "expiry_date",
        "warnings_cautions",
        "importer_name",
        "importer_address",
        "udi_di",
        "storage_conditions"
    ]

    @staticmethod
    def compare_labels(
        base_label: Dict[str, Any],
        revised_label: Dict[str, Any],
        base_name: str = "Original Label",
        revised_name: str = "Revised Label"
    ) -> Dict[str, Any]:
        field_changes = []
        critical_alerts = []

        all_keys = sorted(list(set(list(base_label.keys()) + list(revised_label.keys()))))
        # Filter out system keys
        relevant_keys = [k for k in all_keys if k not in ["id", "created_at", "updated_at", "user_id", "project_id"]]

        for key in relevant_keys:
            val_base = base_label.get(key)
            val_revised = revised_label.get(key)

            # Normalize None/empty string
            s_base = "" if val_base is None else str(val_base).strip()
            s_rev = "" if val_revised is None else str(val_revised).strip()

            if not s_base and not s_rev:
                continue

            change_type = "unchanged"
            if not s_base and s_rev:
                change_type = "added"
            elif s_base and not s_rev:
                change_type = "removed"
            elif s_base != s_rev:
                change_type = "modified"

            is_critical = key in ComparisonEngine.CRITICAL_REGULATORY_FIELDS

            field_changes.append({
                "field": key,
                "label": key.replace("_", " ").title(),
                "base_value": s_base or None,
                "revised_value": s_rev or None,
                "change_type": change_type,
                "is_critical": is_critical
            })

            # Detect regulatory impact
            if change_type != "unchanged" and is_critical:
                if change_type == "removed":
                    critical_alerts.append(f"Critical field '{key}' was removed in the revised label.")
                elif change_type == "modified":
                    critical_alerts.append(f"Regulatory parameter '{key}' was modified: '{s_base}' -> '{s_rev}'.")
                elif change_type == "added":
                    critical_alerts.append(f"Regulatory parameter '{key}' added: '{s_rev}'.")

        # Generate Unified Text Diff
        base_text_lines = ComparisonEngine._format_label_for_text_diff(base_label, base_name)
        revised_text_lines = ComparisonEngine._format_label_for_text_diff(revised_label, revised_name)

        diff = list(difflib.unified_diff(
            base_text_lines,
            revised_text_lines,
            fromfile=base_name,
            tofile=revised_name,
            lineterm=""
        ))

        unified_diff_str = "\n".join(diff)

        # Count change stats
        added_count = sum(1 for c in field_changes if c["change_type"] == "added")
        removed_count = sum(1 for c in field_changes if c["change_type"] == "removed")
        modified_count = sum(1 for c in field_changes if c["change_type"] == "modified")

        return {
            "base_name": base_name,
            "revised_name": revised_name,
            "summary": {
                "total_fields_compared": len(field_changes),
                "added_fields": added_count,
                "removed_fields": removed_count,
                "modified_fields": modified_count,
                "critical_changes_detected": len(critical_alerts),
                "critical_alerts": critical_alerts
            },
            "field_changes": field_changes,
            "text_diff": unified_diff_str
        }

    @staticmethod
    def _format_label_for_text_diff(label: Dict[str, Any], title: str) -> List[str]:
        lines = [f"=== {title} ==="]
        for k in sorted(label.keys()):
            if k in ["id", "created_at", "updated_at", "user_id", "project_id"]:
                continue
            lines.append(f"{k}: {label.get(k)}")
        return lines
