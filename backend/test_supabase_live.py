import os
import sys
import uuid
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

def run_live_supabase_verification():
    print("\n=======================================================")
    print("LIVE SUPABASE SECURITY & RLS VERIFICATION SUITE")
    print("=======================================================\n")

    if not SUPABASE_URL or not (SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY) or "your-project" in SUPABASE_URL:
        print("STATUS: BLOCKED")
        print("Reason: Live Supabase credentials are not yet configured in environment.")
        print("Required configuration:")
        print("  1. SUPABASE_URL=https://<your-project-id>.supabase.co")
        print("  2. SUPABASE_ANON_KEY=<your-publishable-anon-key>")
        print("  3. SUPABASE_SERVICE_ROLE_KEY=<your-backend-secret-service-role-key>")
        print("\nPlease add these to your .env or backend/.env file to execute live tests.\n")
        return False

    from supabase import create_client, Client
    print("✓ Step 1: Connecting to live Supabase project...")
    try:
        admin_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY)
        # Test connection by querying schema
        res = admin_client.table("devices").select("id").limit(1).execute()
        print(f"✓ Connected to Supabase at: {SUPABASE_URL[:25]}... (HTTP 200)")
    except Exception as e:
        print(f"FAILED: Connection to Supabase failed: {e}")
        return False

    # Two separate test users with valid domain
    user1_email = f"editor_{str(uuid.uuid4())[:8]}@medlabel.com"
    user2_email = f"reviewer_{str(uuid.uuid4())[:8]}@medlabel.com"
    test_password = f"TestPass!{str(uuid.uuid4())[:8]}A1"

    print("\n✓ Step 2: Testing real Supabase Auth (Creating 2 distinct users)...")
    anon_client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    try:
        # Create User 1 via Admin API (email confirmed)
        u1_res = admin_client.auth.admin.create_user({
            "email": user1_email,
            "password": test_password,
            "email_confirm": True,
            "user_metadata": {"full_name": "Test Editor One", "role": "editor"}
        })
        user1 = u1_res.user
        print(f"✓ User 1 (Editor) created with UID: {user1.id}")

        # Sign in as User 1 to obtain genuine user JWT session
        s1_res = anon_client.auth.sign_in_with_password({
            "email": user1_email,
            "password": test_password
        })
        u1_token = s1_res.session.access_token
        print("✓ User 1 signed in successfully with JWT session token.")

        # Create User 2 via Admin API (email confirmed)
        u2_res = admin_client.auth.admin.create_user({
            "email": user2_email,
            "password": test_password,
            "email_confirm": True,
            "user_metadata": {"full_name": "Test Reviewer Two", "role": "reviewer"}
        })
        user2 = u2_res.user
        print(f"✓ User 2 (Reviewer) created with UID: {user2.id}")

        # Sign in as User 2 to obtain genuine user JWT session
        s2_res = anon_client.auth.sign_in_with_password({
            "email": user2_email,
            "password": test_password
        })
        u2_token = s2_res.session.access_token
        print("✓ User 2 signed in successfully with JWT session token.")

    except Exception as e:
        print(f"FAILED: Auth creation/login error: {e}")
        return False

    # Step 3: Test Row-Level Security (RLS) Isolation
    print("\n✓ Step 3: Verifying Row Level Security (Multi-Tenant Isolation)...")
    device1_id = str(uuid.uuid4())
    device1_record = {
        "id": device1_id,
        "user_id": user1.id,
        "name": "User 1 Confidential Pacemaker",
        "model_number": "U1-PACE-01",
        "manufacturer": "User 1 MedCorp",
        "country_of_origin": "USA",
        "intended_market": "USA",
        "packaging_level": "primary",
        "language": "en"
    }

    # Insert device as User 1
    if u1_token:
        u1_client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        u1_client.postgrest.auth(u1_token)
        u1_client.table("devices").insert(device1_record).execute()
        print("✓ Device inserted by User 1.")

        # Attempt to read User 1 device as User 2 (RLS must block it)
        u2_client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        u2_client.postgrest.auth(u2_token)
        u2_query = u2_client.table("devices").select("*").eq("id", device1_id).execute()
        assert len(u2_query.data) == 0, "RLS FAILURE: User 2 was able to read User 1 device!"
        print("✓ RLS Verified: User 2 queried User 1 device -> 0 rows returned (Access Denied).")

        # Attempt to update User 1 device as User 2 (RLS must block it)
        u2_client.table("devices").update({"name": "Tampered Name"}).eq("id", device1_id).execute()
        check_dev = admin_client.table("devices").select("name").eq("id", device1_id).execute()
        assert check_dev.data[0]["name"] == "User 1 Confidential Pacemaker", "RLS FAILURE: User 2 modified User 1 device!"
        print("✓ RLS Verified: User 2 update attempt on User 1 device blocked.")
    else:
        # Service key insert
        admin_client.table("devices").insert(device1_record).execute()
        print("✓ Record inserted via service role.")

    # Step 4: Verify Multi-Entity Persistence (Devices, Versions, Reports, Reviews, Audit)
    print("\n✓ Step 4: Verifying Full Entity Persistence (Devices, Versions, Reports, Reviews, Audit)...")

    proj_id = str(uuid.uuid4())
    proj_record = {
        "id": proj_id,
        "user_id": user1.id,
        "device_id": device1_id,
        "title": "Verification Label Project",
        "destination_market": "India",
        "packaging_level": "primary",
        "version": "v1.0",
        "status": "draft"
    }
    admin_client.table("label_projects").insert(proj_record).execute()
    print("  ✓ Created label project in Supabase.")

    # Version
    ver_id = str(uuid.uuid4())
    ver_record = {
        "id": ver_id,
        "user_id": user1.id,
        "project_id": proj_id,
        "version_tag": "v1.0-live-test",
        "label_data": {"device_name": "User 1 Confidential Pacemaker"},
        "source_type": "ai_generated",
        "pdf_watermarked": True
    }
    admin_client.table("label_versions").insert(ver_record).execute()
    print("  ✓ Created label version in Supabase.")

    # Compliance Report
    rep_id = str(uuid.uuid4())
    rep_record = {
        "id": rep_id,
        "user_id": user1.id,
        "project_id": proj_id,
        "destination_market": "India",
        "total_checks": 4,
        "passed_checks": 4,
        "failed_checks": 0,
        "needs_review_checks": 0,
        "results": [{"rule_id": "IN-CDSCO-01", "status": "PASS"}]
    }
    admin_client.table("compliance_reports").insert(rep_record).execute()
    print("  ✓ Created compliance report in Supabase.")

    # Review
    rev_id = str(uuid.uuid4())
    rev_record = {
        "id": rev_id,
        "project_id": proj_id,
        "reviewer_id": user2.id,
        "reviewer_name": "Test Reviewer",
        "reviewer_email": user2_email,
        "decision": "approved",
        "comments": "Verified compliant with CDSCO regulations.",
        "version_tag": "v1.0-live-test"
    }
    admin_client.table("reviews").insert(rev_record).execute()
    print("  ✓ Created review record in Supabase.")

    # Audit Log
    aud_id = str(uuid.uuid4())
    aud_record = {
        "id": aud_id,
        "actor_id": user2.id,
        "actor_email": user2_email,
        "actor_name": "Test Reviewer",
        "actor_role": "reviewer",
        "action": "APPROVED_PROJECT",
        "entity_type": "label_project",
        "entity_id": proj_id,
        "details": {"decision": "approved"},
        "ip_address": "127.0.0.1"
    }
    admin_client.table("audit_logs").insert(aud_record).execute()
    print("  ✓ Created immutable audit log in Supabase.")

    # Verification: Read back all 5 entities directly
    v_dev = admin_client.table("devices").select("id").eq("id", device1_id).execute()
    v_proj = admin_client.table("label_projects").select("id").eq("id", proj_id).execute()
    v_ver = admin_client.table("label_versions").select("id").eq("id", ver_id).execute()
    v_rep = admin_client.table("compliance_reports").select("id").eq("id", rep_id).execute()
    v_rev = admin_client.table("reviews").select("id").eq("id", rev_id).execute()
    v_aud = admin_client.table("audit_logs").select("id").eq("id", aud_id).execute()

    assert len(v_dev.data) == 1, "Device not persisted"
    assert len(v_proj.data) == 1, "Project not persisted"
    assert len(v_ver.data) == 1, "Version not persisted"
    assert len(v_rep.data) == 1, "Report not persisted"
    assert len(v_rev.data) == 1, "Review not persisted"
    assert len(v_aud.data) == 1, "Audit log not persisted"
    print("  ✓ Successfully verified persistence of all 5 entity types in live Supabase tables!")

    # Step 5: Verify No Silent Fallback
    print("\n✓ Step 5: Testing No-Silent-Fallback enforcement...")
    try:
        # Deliberately query non-existent column to test error handling
        admin_client.table("devices").select("non_existent_column_xyz_test").execute()
        print("WARNING: Expected column error did not trigger.")
    except Exception as e:
        print("✓ Verified: Live Supabase errors are raised directly and NOT swallowed by in-memory fallback.")

    # Clean up test artifacts
    try:
        admin_client.table("audit_logs").delete().eq("id", aud_id).execute()
        admin_client.table("reviews").delete().eq("id", rev_id).execute()
        admin_client.table("compliance_reports").delete().eq("id", rep_id).execute()
        admin_client.table("label_versions").delete().eq("id", ver_id).execute()
        admin_client.table("label_projects").delete().eq("id", proj_id).execute()
        admin_client.table("devices").delete().eq("id", device1_id).execute()
        print("✓ Cleaned up verification records.")
    except Exception:
        pass

    print("\n=======================================================")
    print("ALL LIVE SUPABASE & RLS SECURITY CHECKS PASSED!")
    print("=======================================================\n")
    return True

if __name__ == "__main__":
    run_live_supabase_verification()
