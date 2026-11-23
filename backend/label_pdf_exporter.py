import io
from datetime import datetime, timezone
from typing import Dict, Any
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class WatermarkedCanvas(canvas.Canvas):
    """Custom canvas that draws a prominent diagonal regulatory prototype warning watermark
    across every page to ensure strict compliance with hackathon prototype constraints.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self.pages)
        for page in self.pages:
            self.__dict__.update(page)
            self.draw_watermark()
            super().showPage()
        super().save()

    def draw_watermark(self):
        self.saveState()
        self.setFont("Helvetica-Bold", 32)
        self.setFillColor(colors.HexColor("#dc2626"), alpha=0.12)
        self.translate(300, 420)
        self.rotate(35)
        self.drawCentredString(0, 0, "MEDLABEL AI PROTOTYPE ONLY")
        self.setFont("Helvetica-Bold", 13)
        self.drawCentredString(0, -30, "NOT LEGAL CERTIFICATION - NOT CDSCO / FDA / CE APPROVED")
        self.restoreState()


class LabelPdfExporter:
    """Generates regulatory draft medical-device labels with ISO 15223-1 symbols
    and mandatory prototype disclaimers.
    """

    @staticmethod
    def generate_pdf_bytes(label_data: Dict[str, Any], market: str = "India") -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'LabelTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0a2540")
        )

        subtitle_style = ParagraphStyle(
            'LabelSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#2563eb")
        )

        field_label_style = ParagraphStyle(
            'FieldLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#475569")
        )

        field_value_style = ParagraphStyle(
            'FieldValue',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#0f172a")
        )

        disclaimer_style = ParagraphStyle(
            'DisclaimerText',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#991b1b"),
            alignment=1
        )

        story = []

        # Header Banner
        header_text = f"<b>MEDLABEL AI — REGULATORY DRAFT LABEL [{market.upper()}]</b>"
        story.append(Paragraph(header_text, subtitle_style))
        story.append(Spacer(1, 4))
        
        # Prototype notice
        disclaimer_box = [
            [Paragraph("⚠️ HACKATHON PROTOTYPE SPECIFICATION — FOR EVALUATION ONLY.<br/>NOT OFFICIAL REGULATORY APPROVAL OR CERTIFIED COMPLIANCE UNDER INDIA CDSCO / US FDA / EU MDR.", disclaimer_style)]
        ]
        t_disc = Table(disclaimer_box, colWidths=[540])
        t_disc.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fef2f2")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#fecaca")),
            ('PADDING', (0,0), (-1,-1), 6),
            ('ALIGN', (0,0), (-1,-1), 'CENTER')
        ]))
        story.append(t_disc)
        story.append(Spacer(1, 10))

        # Device Header
        name = label_data.get("name") or "Medical Device Title"
        model = label_data.get("model_number") or "Model / Code"
        mfg = label_data.get("manufacturer") or "Legal Manufacturer Name & Address"
        origin = label_data.get("country_of_origin") or "Country of Origin"
        pkg = label_data.get("packaging_level", "primary").capitalize()

        story.append(Paragraph(f"<b>{name}</b>", title_style))
        story.append(Paragraph(f"<b>REF / Model:</b> {model} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Packaging Level:</b> {pkg}", subtitle_style))
        story.append(Spacer(1, 8))

        # Main Label Data Table (with ISO-style icons and clean layout)
        lot = label_data.get("lot_number") or "N/A"
        sn = label_data.get("serial_number") or "N/A"
        mfg_date = label_data.get("manufacturing_date") or "N/A"
        exp_date = label_data.get("expiry_date") or "N/A"
        udi = label_data.get("udi_di") or "N/A"
        storage = label_data.get("storage_conditions") or "Store in clean, dry ambient conditions."
        warnings = label_data.get("warnings_cautions") or "See Instructions for Use. Single use only."

        table_data = [
            [
                Paragraph("<b>[🏭] Legal Manufacturer:</b>", field_label_style),
                Paragraph(f"{mfg}<br/><b>Country of Origin:</b> {origin}", field_value_style),
                Paragraph("<b>[📅 / ⌛] Dates:</b>", field_label_style),
                Paragraph(f"<b>Mfg Date:</b> {mfg_date}<br/><b>Use-by / Expiry:</b> {exp_date}", field_value_style)
            ],
            [
                Paragraph("<b>[🔲 / 🔢] Batch & Traceability:</b>", field_label_style),
                Paragraph(f"<b>LOT:</b> {lot}<br/><b>SN:</b> {sn}", field_value_style),
                Paragraph("<b>[🌐] Destination Market:</b>", field_label_style),
                Paragraph(f"<b>Jurisdiction:</b> {market}<br/><b>Language:</b> {label_data.get('language', 'en').upper()}", field_value_style)
            ]
        ]

        # Conditional Importer Section (Crucial for imported products to India)
        importer_name = label_data.get("importer_name")
        importer_addr = label_data.get("importer_address")
        if importer_name:
            table_data.append([
                Paragraph("<b>[🏢] Authorized Importer:</b>", field_label_style),
                Paragraph(f"<b>{importer_name}</b><br/>{importer_addr or 'Indian Importer Address & CDSCO Lic'}", field_value_style),
                Paragraph("<b>[⚠️] Regulatory Notice:</b>", field_label_style),
                Paragraph("Imported medical device under CDSCO Rule 44(c) / applicable national provisions.", field_value_style)
            ])

        # UDI & Storage
        table_data.append([
            Paragraph("<b>[DI] Unique Device Identifier:</b>", field_label_style),
            Paragraph(f"<font face='Courier'><b>UDI-DI:</b> {udi}</font>", field_value_style),
            Paragraph("<b>[🌡️] Storage Conditions:</b>", field_label_style),
            Paragraph(storage, field_value_style)
        ])

        table_data.append([
            Paragraph("<b>[⚠️] Warnings & Precautions:</b>", field_label_style),
            Paragraph(warnings, field_value_style),
            Paragraph("<b>[ℹ️] Instructions:</b>", field_label_style),
            Paragraph("Consult Instructions for Use (IFU) before clinical administration.", field_value_style)
        ])

        t_main = Table(table_data, colWidths=[120, 160, 110, 150])
        t_main.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ffffff")),
            ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#0a2540")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 6)
        ]))
        story.append(t_main)
        story.append(Spacer(1, 14))

        # Simulated Human Readable UDI Carrier Barcode Box
        barcode_box = [
            [
                Paragraph(f"<b>GS1 UDI CARRIER (HRI / AIDC SIMULATION):</b><br/><font face='Courier' size=10><b>{udi} &nbsp; (17){exp_date.replace('-','')[2:] if exp_date != 'N/A' else '000000'} &nbsp; (10){lot} &nbsp; (21){sn}</b></font>", field_value_style)
            ]
        ]
        t_bar = Table(barcode_box, colWidths=[540])
        t_bar.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
            ('PADDING', (0,0), (-1,-1), 8),
            ('ALIGN', (0,0), (-1,-1), 'CENTER')
        ]))
        story.append(t_bar)

        # Build document with watermarked canvas
        doc.build(story, canvasmaker=WatermarkedCanvas)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
