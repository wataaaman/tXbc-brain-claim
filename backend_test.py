#!/usr/bin/env python3
"""
Backend API Testing for Tech X Brain Collective
Tests all backend APIs according to test_result.md requirements
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BASE_URL = "https://life-show-portal.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def register_and_login(self):
        """Register a test user and get auth token"""
        print("\n=== AUTHENTICATION SETUP ===")
        
        # Register user
        register_data = {
            "email": "test@techxbrain.com",
            "name": "Test User",
            "password": "test123456"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json=register_data)
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("token")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_test("User Registration", True, "Successfully registered test user")
                return True
            elif response.status_code == 400 and "already registered" in response.text:
                # User exists, try login
                login_data = {
                    "email": "test@techxbrain.com", 
                    "password": "test123456"
                }
                response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
                if response.status_code == 200:
                    data = response.json()
                    self.auth_token = data.get("token")
                    self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                    self.log_test("User Login", True, "Successfully logged in existing user")
                    return True
                else:
                    self.log_test("User Login", False, f"Login failed: {response.status_code} - {response.text}")
                    return False
            else:
                self.log_test("User Registration", False, f"Registration failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_test("Authentication Setup", False, f"Exception: {str(e)}")
            return False
    
    def test_health_check(self):
        """Test basic health endpoint"""
        print("\n=== HEALTH CHECK ===")
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health Check", True, "API is healthy", data)
                else:
                    self.log_test("Health Check", False, f"Unexpected health status: {data}")
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
    
    def test_portal_registry(self):
        """Test Portal Registry API (no auth needed)"""
        print("\n=== PORTAL REGISTRY ===")
        try:
            response = self.session.get(f"{BASE_URL}/portals")
            if response.status_code == 200:
                data = response.json()
                portals = data.get("portals", [])
                if len(portals) == 6:
                    portal_names = [p.get("name", "") for p in portals]
                    expected_portals = ["Founders' Brain Portal", "Brain Injury Foundation Portal", 
                                      "Insurance Portal", "Legal & Case Management", 
                                      "Health & Science Portal", "Finance & Rewards Portal"]
                    
                    all_found = all(any(expected in name for name in portal_names) for expected in expected_portals)
                    if all_found:
                        self.log_test("Portal Registry", True, f"Found all 6 portals: {[p['name'] for p in portals]}")
                    else:
                        self.log_test("Portal Registry", False, f"Missing expected portals. Found: {portal_names}")
                else:
                    self.log_test("Portal Registry", False, f"Expected 6 portals, got {len(portals)}")
            else:
                self.log_test("Portal Registry", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Portal Registry", False, f"Exception: {str(e)}")
    
    def test_insurance_module(self):
        """Test Insurance Module APIs (no auth needed)"""
        print("\n=== INSURANCE MODULE ===")
        
        # Test insurance types
        try:
            response = self.session.get(f"{BASE_URL}/insurance/types")
            if response.status_code == 200:
                data = response.json()
                types = data.get("insurance_types", [])
                if len(types) == 4:
                    type_ids = [t.get("type_id") for t in types]
                    expected_types = ["health", "life", "vehicle", "house"]
                    if all(t in type_ids for t in expected_types):
                        self.log_test("Insurance Types", True, f"Found all 4 insurance types: {type_ids}")
                    else:
                        self.log_test("Insurance Types", False, f"Missing types. Expected: {expected_types}, Got: {type_ids}")
                else:
                    self.log_test("Insurance Types", False, f"Expected 4 types, got {len(types)}")
            else:
                self.log_test("Insurance Types", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Insurance Types", False, f"Exception: {str(e)}")
        
        # Test compliance endpoint
        try:
            response = self.session.get(f"{BASE_URL}/insurance/compliance")
            if response.status_code == 200:
                data = response.json()
                if data.get("jurisdiction") == "Alberta, Canada" and "compliance_requirements" in data:
                    requirements = data.get("compliance_requirements", [])
                    self.log_test("Insurance Compliance", True, f"Got compliance checklist with {len(requirements)} requirements")
                else:
                    self.log_test("Insurance Compliance", False, f"Missing expected compliance data: {data}")
            else:
                self.log_test("Insurance Compliance", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Insurance Compliance", False, f"Exception: {str(e)}")
    
    def test_governance_apis(self):
        """Test DAO Governance APIs (auth needed for create/vote)"""
        print("\n=== DAO GOVERNANCE ===")
        
        # Test get proposals (no auth needed)
        try:
            response = self.session.get(f"{BASE_URL}/governance/proposals")
            if response.status_code == 200:
                data = response.json()
                proposals = data.get("proposals", [])
                self.log_test("Get Proposals", True, f"Retrieved {len(proposals)} proposals")
            else:
                self.log_test("Get Proposals", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Proposals", False, f"Exception: {str(e)}")
        
        # Test governance stats
        try:
            response = self.session.get(f"{BASE_URL}/governance/stats")
            if response.status_code == 200:
                data = response.json()
                if "total_proposals" in data and "treasury_balance" in data:
                    self.log_test("Governance Stats", True, f"Stats: {data['total_proposals']} total, {data['treasury_balance']} treasury")
                else:
                    self.log_test("Governance Stats", False, f"Missing expected stats fields: {data}")
            else:
                self.log_test("Governance Stats", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Governance Stats", False, f"Exception: {str(e)}")
        
        # Test create proposal (auth required)
        if self.auth_token:
            try:
                proposal_data = {
                    "title": "Test Proposal for TBI Support",
                    "description": "A test proposal to improve TBI survivor support services",
                    "category": "policy",
                    "voting_period_days": 7
                }
                response = self.session.post(f"{BASE_URL}/governance/proposals", json=proposal_data)
                if response.status_code == 200:
                    data = response.json()
                    proposal_id = data.get("proposal_id")
                    self.log_test("Create Proposal", True, f"Created proposal: {proposal_id}")
                    
                    # Test voting on the proposal
                    if proposal_id:
                        vote_data = {"vote": "for"}
                        vote_response = self.session.post(f"{BASE_URL}/governance/proposals/{proposal_id}/vote", json=vote_data)
                        if vote_response.status_code == 200:
                            self.log_test("Vote on Proposal", True, "Successfully voted 'for' on proposal")
                        else:
                            self.log_test("Vote on Proposal", False, f"Vote failed: {vote_response.status_code} - {vote_response.text}")
                else:
                    self.log_test("Create Proposal", False, f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_test("Create Proposal", False, f"Exception: {str(e)}")
        else:
            self.log_test("Create Proposal", False, "No auth token available")
    
    def test_legal_case_management(self):
        """Test Legal Case Management APIs (auth needed)"""
        print("\n=== LEGAL CASE MANAGEMENT ===")
        
        if not self.auth_token:
            self.log_test("Legal Case Management", False, "No auth token available")
            return
        
        # Test create case
        try:
            case_data = {
                "title": "WCB Appeal for TBI Claim",
                "case_type": "wcb_appeal",
                "description": "Appealing WCB decision on TBI classification and benefits",
                "priority": "high"
            }
            response = self.session.post(f"{BASE_URL}/legal/cases", json=case_data)
            if response.status_code == 200:
                data = response.json()
                case_id = data.get("case_id")
                self.log_test("Create Legal Case", True, f"Created case: {case_id}")
                
                # Test get cases
                cases_response = self.session.get(f"{BASE_URL}/legal/cases")
                if cases_response.status_code == 200:
                    cases_data = cases_response.json()
                    cases = cases_data.get("cases", [])
                    self.log_test("Get Legal Cases", True, f"Retrieved {len(cases)} cases")
                else:
                    self.log_test("Get Legal Cases", False, f"HTTP {cases_response.status_code}: {cases_response.text}")
                
                # Test policy review request
                if case_id:
                    review_response = self.session.post(f"{BASE_URL}/legal/cases/{case_id}/review")
                    if review_response.status_code == 200:
                        self.log_test("Request Policy Review", True, "Successfully requested policy review with reversal capability")
                    else:
                        self.log_test("Request Policy Review", False, f"HTTP {review_response.status_code}: {review_response.text}")
            else:
                self.log_test("Create Legal Case", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Legal Case Management", False, f"Exception: {str(e)}")
    
    def test_multi_ai_agents(self):
        """Test Multi-AI Agent System APIs"""
        print("\n=== MULTI-AI AGENT SYSTEM ===")
        
        # Test get agents (no auth needed)
        try:
            response = self.session.get(f"{BASE_URL}/agents")
            if response.status_code == 200:
                data = response.json()
                agents = data.get("agents", [])
                if len(agents) == 6:
                    agent_names = [a.get("name", "") for a in agents]
                    expected_agents = ["Fetch.ai", "Heurist.ai", "Gaianet.ai", "Baselight.ai", "Zo.computer", "Autonomys"]
                    
                    found_agents = []
                    for expected in expected_agents:
                        if any(expected in name for name in agent_names):
                            found_agents.append(expected)
                    
                    if len(found_agents) == 6:
                        self.log_test("Get AI Agents", True, f"Found all 6 agents: {found_agents}")
                    else:
                        self.log_test("Get AI Agents", False, f"Missing agents. Expected: {expected_agents}, Found: {found_agents}")
                else:
                    self.log_test("Get AI Agents", False, f"Expected 6 agents, got {len(agents)}")
            else:
                self.log_test("Get AI Agents", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get AI Agents", False, f"Exception: {str(e)}")
        
        # NOTE: Not testing POST /api/agents/query as per instructions (requires LLM calls)
        print("ℹ️  Skipping POST /api/agents/query as instructed (requires LLM calls)")
    
    def test_existing_apis(self):
        """Test existing APIs that should still work"""
        print("\n=== EXISTING APIS ===")
        
        # Test policies endpoint
        try:
            response = self.session.get(f"{BASE_URL}/policies")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("WCB Policies", True, f"Retrieved {len(data)} WCB policies")
                else:
                    self.log_test("WCB Policies", False, f"No policies returned: {data}")
            else:
                self.log_test("WCB Policies", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("WCB Policies", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Tech X Brain Collective Backend API Tests")
        print(f"Backend URL: {BASE_URL}")
        
        # Basic health check
        self.test_health_check()
        
        # Authentication setup
        auth_success = self.register_and_login()
        
        # Test all modules
        self.test_portal_registry()
        self.test_insurance_module()
        self.test_governance_apis()
        self.test_legal_case_management()
        self.test_multi_ai_agents()
        self.test_existing_apis()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("🏁 TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for r in self.test_results if r["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        print("\n📊 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"  {status} {result['test']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)