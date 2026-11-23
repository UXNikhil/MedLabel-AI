-- ==============================================================================
-- MedLabel AI — Stage 1 Seed Data for Testing & Demonstration
-- Includes PRD imported product example: Germany -> India import with CDSCO requirements
-- ==============================================================================

-- Note: Replace '00000000-0000-0000-0000-000000000001' with your active auth.uid() if running in Supabase

DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
    device_1_id UUID := '11111111-1111-1111-1111-111111111111';
    device_2_id UUID := '22222222-2222-2222-2222-222222222222';
    device_3_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- 1. Germany -> India Imported Product (PRD Primary Example)
    INSERT INTO public.devices (
        id, user_id, name, model_number, manufacturer, country_of_origin, intended_market,
        importer_name, importer_address, lot_number, serial_number,
        manufacturing_date, expiry_date, storage_conditions, warnings_cautions,
        udi_di, udi_pi, packaging_level, language
    ) VALUES (
        device_1_id,
        demo_user_id,
        'CardioPulse Dual-Chamber Pacemaker',
        'CP-420-X',
        'Berlin MedTech AG (Berlin, Germany)',
        'Germany',
        'India',
        'Arogya MedTech India Private Limited',
        'Plot 42, Okhla Industrial Area Phase III, New Delhi 110020, India (Mfg Lic: IMP/MD/2024/00421)',
        'LOT-2024-GER01',
        'SN-8849201',
        '2024-03-15',
        '2029-03-14',
        'Store between 5°C and 25°C in dry conditions',
        'MR Unsafe unless programmed. Contains lithium-iodine power source. Single use only.',
        '(01)04012345678901',
        '(17)290314(10)LOT-2024-GER01(21)SN-8849201',
        'primary',
        'en'
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. US Domestic Orthopedic Implant (US FDA 21 CFR Part 801)
    INSERT INTO public.devices (
        id, user_id, name, model_number, manufacturer, country_of_origin, intended_market,
        importer_name, importer_address, lot_number, serial_number,
        manufacturing_date, expiry_date, storage_conditions, warnings_cautions,
        udi_di, udi_pi, packaging_level, language
    ) VALUES (
        device_2_id,
        demo_user_id,
        'TitanFix Femoral Compression Plate System',
        'TF-PLATE-8H',
        'OrthoBiome Inc. (Memphis, TN, USA)',
        'USA',
        'USA',
        NULL,
        NULL,
        'LOT-US-9912',
        'SN-55219',
        '2024-06-01',
        '2029-05-31',
        'Store at ambient room temperature 15°C to 30°C',
        'Rx Only. Caution: Federal law restricts this device to sale by or on the order of a licensed physician.',
        '(01)00840123456784',
        '(17)290531(10)LOT-US-9912',
        'secondary',
        'en'
    ) ON CONFLICT (id) DO NOTHING;

    -- 3. EU In-Vitro Diagnostic Blood Analyzer Cartridge (EU MDR 2017/745 / IVDR)
    INSERT INTO public.devices (
        id, user_id, name, model_number, manufacturer, country_of_origin, intended_market,
        importer_name, importer_address, lot_number, serial_number,
        manufacturing_date, expiry_date, storage_conditions, warnings_cautions,
        udi_di, udi_pi, packaging_level, language
    ) VALUES (
        device_3_id,
        demo_user_id,
        'HemoSense Point-of-Care Coagulation Cartridge',
        'HS-POC-100',
        'BioDiagnostics SAS (Lyon, France)',
        'France',
        'EU',
        NULL,
        NULL,
        'LOT-EU-3301',
        'SN-POC-771',
        '2024-09-10',
        '2025-09-09',
        'Refrigerated storage required: 2°C to 8°C. Do not freeze.',
        'In Vitro Diagnostic Medical Device. For professional healthcare use only. Single use.',
        '(01)03701234567895',
        '(17)250909(10)LOT-EU-3301',
        'primary',
        'en'
    ) ON CONFLICT (id) DO NOTHING;

    -- Label Projects
    INSERT INTO public.label_projects (
        id, user_id, device_id, title, destination_market, packaging_level, version, status, notes
    ) VALUES (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        demo_user_id,
        device_1_id,
        'CardioPulse CDSCO Primary Blister Label',
        'India',
        'primary',
        'v1.0-draft',
        'draft',
        'Initial draft for India destination market. Importer Arogya MedTech information and CDSCO licence format required.'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.label_projects (
        id, user_id, device_id, title, destination_market, packaging_level, version, status, notes
    ) VALUES (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        demo_user_id,
        device_2_id,
        'TitanFix FDA Outer Carton Secondary Label',
        'USA',
        'secondary',
        'v1.0-draft',
        'in_review',
        'FDA 21 CFR 801 Rx Only warning and English language compliance verified.'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.label_projects (
        id, user_id, device_id, title, destination_market, packaging_level, version, status, notes
    ) VALUES (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        demo_user_id,
        device_3_id,
        'HemoSense EU MDR Sterile Barrier Label',
        'EU',
        'primary',
        'v1.0-draft',
        'draft',
        'Sterile barrier packaging requirements and EU IVDR temperature indicator labels.'
    ) ON CONFLICT (id) DO NOTHING;

END $$;
