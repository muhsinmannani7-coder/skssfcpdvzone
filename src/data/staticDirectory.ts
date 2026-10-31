// Automatically generated static fallback directory for offline-first 0ms instant display
export interface StaticCluster {
  id: string
  name: string
  code: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface StaticUnit {
  id: string
  name: string
  cluster_id: string
  sort_order: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface StaticMemberPosition {
  id?: string
  unit_id?: string | null
  cluster_id?: string | null
  positions?: { id?: string; title: string; sort_order: number } | Array<{ id?: string; title: string; sort_order: number }> | null
  committees?: { id?: string; name: string; level: 'zone' | 'cluster' | 'unit' } | Array<{ id?: string; name: string; level: 'zone' | 'cluster' | 'unit' }> | null
  clusters?: { id?: string; name: string; code?: string } | Array<{ id?: string; name: string; code?: string }> | null
  units?: { id?: string; name: string; cluster_id?: string } | Array<{ id?: string; name: string; cluster_id?: string }> | null
}

export interface StaticMember {
  id: string
  full_name: string
  mobile: string
  membership_number?: string | null
  member_positions?: StaticMemberPosition[]
}

export interface StaticDirectory {
  clusters: StaticCluster[]
  units: StaticUnit[]
  members: StaticMember[]
}

export const STATIC_DIRECTORY: StaticDirectory = {
  "clusters": [
    {
      "id": "82a5343b-7c51-4276-a398-7e86db294549",
      "name": "KUTTAPARAMB CLUSTER",
      "code": "KUT",
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "d60804b7-461f-4202-bd40-06168389d25b",
      "name": "PADAPPENGAD CLUSTER",
      "code": "PAD",
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
      "name": "PERUMALABAD CLUSTER",
      "code": "PER",
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    }
  ],
  "units": [
    {
      "id": "00000000-0000-0000-0003-000000000001",
      "name": "PERUVANA UNIT",
      "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0001-000000000001",
      "name": "SHANTHIGIRI UNIT",
      "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0002-000000000001",
      "name": "KUTTAPARAMB UNIT",
      "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0003-000000000002",
      "name": "ERUVATTI UNIT",
      "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
      "sort_order": 2,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0002-000000000002",
      "name": "RAYAROM UNIT",
      "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
      "sort_order": 2,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0001-000000000002",
      "name": "VILAKKANNOOR UNIT",
      "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
      "sort_order": 2,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0003-000000000003",
      "name": "MANGARA BADARIYYA NAGAR UNIT",
      "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
      "sort_order": 3,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0002-000000000003",
      "name": "THADIKKADAV UNIT",
      "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
      "sort_order": 3,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0001-000000000003",
      "name": "PADAPPENGAD UNIT",
      "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
      "sort_order": 3,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0002-000000000004",
      "name": "NEDUVOODE UNIT",
      "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
      "sort_order": 4,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0003-000000000004",
      "name": "PERUMALABAD UNIT",
      "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
      "sort_order": 4,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0001-000000000004",
      "name": "NADUVIL UNIT",
      "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
      "sort_order": 4,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0001-000000000005",
      "name": "ELAMBERAM PARA UNIT",
      "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
      "sort_order": 5,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0002-000000000005",
      "name": "MUNNAMKUNNU UNIT",
      "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
      "sort_order": 5,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0001-000000000006",
      "name": "CHAPPARAPPADAV UNIT",
      "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
      "sort_order": 6,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    },
    {
      "id": "00000000-0000-0000-0002-000000000006",
      "name": "KARUVANCHAL UNIT",
      "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
      "sort_order": 6,
      "is_active": true,
      "created_at": "2026-10-31T05:06:11.07319+00:00",
      "updated_at": "2026-10-31T05:06:11.07319+00:00"
    }
  ],
  "members": [
    {
      "id": "20000000-0000-0000-0000-000000000011",
      "full_name": "UNAIS ASNAVI",
      "mobile": "7306721640",
      "membership_number": "2026/5013",
      "member_positions": [
        {
          "id": "93680129-f638-4f97-a3c4-d251f2fbe23b",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000011",
            "title": "SECRETARIAT MEMBER",
            "sort_order": 11
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000012",
      "full_name": "RIYAS P",
      "mobile": "9961200153",
      "membership_number": "2026/4876",
      "member_positions": [
        {
          "id": "67388d7a-e6d9-45fd-8986-5765167a8207",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000012",
            "title": "SECRETARIAT MEMBER",
            "sort_order": 12
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000013",
      "full_name": "ASHRAF K",
      "mobile": "9846202327",
      "membership_number": "2026/5116",
      "member_positions": [
        {
          "id": "9042a30a-7432-4dbf-8b1a-cccc1482d803",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000013",
            "title": "SECRETARIAT MEMBER",
            "sort_order": 13
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000014",
      "full_name": "AFSAL RAHMANI",
      "mobile": "9947527941",
      "membership_number": "2026/4983",
      "member_positions": [
        {
          "id": "f1d8d3dc-533a-4a08-9b83-07251f123c8c",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000014",
            "title": "SECRETARIAT MEMBER",
            "sort_order": 14
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        },
        {
          "id": "d96af6c1-4685-4926-8e41-4625e7867f06",
          "units": {
            "id": "00000000-0000-0000-0002-000000000006",
            "name": "KARUVANCHAL UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000006",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0006-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000015",
            "name": "KARUVANCHAL UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000015",
      "full_name": "DILSHAD N",
      "mobile": "9061306033",
      "membership_number": "2026/5122",
      "member_positions": [
        {
          "id": "e183ea81-04be-4f41-b178-04a4f7e2d46a",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000015",
            "title": "SECRETARIAT MEMBER",
            "sort_order": 15
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000016",
      "full_name": "ARSHAD P",
      "mobile": "8590909112",
      "membership_number": "2026/5170",
      "member_positions": [
        {
          "id": "e110ab5a-3739-4207-9ea2-7d772c83e0b1",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000016",
            "title": "SECRETARIAT MEMBER",
            "sort_order": 16
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        },
        {
          "id": "0261c97e-baeb-4303-a211-f76dfc2b7eec",
          "units": {
            "id": "00000000-0000-0000-0001-000000000003",
            "name": "PADAPPENGAD UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000003",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0003-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000032",
            "name": "PADAPPENGAD UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000017",
      "full_name": "MUHAMMED NAFIH KV",
      "mobile": "8547995318",
      "membership_number": "2026/4979",
      "member_positions": [
        {
          "id": "e0756595-2554-4e30-8c84-17e2862bc5b7",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000017",
            "title": "SECRETARIAT MEMBER",
            "sort_order": 17
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        },
        {
          "id": "ae59b34f-070f-436c-869e-74b6915fcfb2",
          "units": {
            "id": "00000000-0000-0000-0001-000000000001",
            "name": "SHANTHIGIRI UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000001",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0001-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000030",
            "name": "SHANTHIGIRI UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000018",
      "full_name": "HANEEFA P",
      "mobile": "9562484778",
      "membership_number": "2026/4961",
      "member_positions": [
        {
          "id": "00eb93c2-25cd-4b99-9a73-1f56ebec7d7c",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000018",
            "title": "SECRETARIAT MEMBER",
            "sort_order": 18
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000019",
      "full_name": "NIZAMUDHEEN K P",
      "mobile": "9061295670",
      "membership_number": "2026/5138",
      "member_positions": [
        {
          "id": "9512b075-ec04-4a97-939c-bc2c02889ca7",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000019",
            "title": "SECRETARIAT MEMBER",
            "sort_order": 19
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        },
        {
          "id": "8bbbc40d-ec21-42a9-bc6a-3a9029fd7db4",
          "units": {
            "id": "00000000-0000-0000-0002-000000000001",
            "name": "KUTTAPARAMB UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000001",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0001-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000010",
            "name": "KUTTAPARAMB UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000020",
      "full_name": "MUHAMMED SHARAFU SHAMEEM K V",
      "mobile": "8606787709",
      "membership_number": "2026/5660",
      "member_positions": [
        {
          "id": "7c0333f2-8f96-4580-9966-371861c2c94d",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000020",
            "title": "SECRETARIAT MEMBER",
            "sort_order": 20
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000021",
      "full_name": "IRSHAD M",
      "mobile": "7510221259",
      "membership_number": "2026/4892",
      "member_positions": [
        {
          "id": "a2cba694-3381-4eec-930a-36f689c8e99e",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000021",
            "title": "SECRETARIAT MEMBER",
            "sort_order": 21
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        },
        {
          "id": "2dfd5af1-6e87-4e9e-b3c1-2d0025c9872a",
          "units": {
            "id": "00000000-0000-0000-0003-000000000003",
            "name": "MANGARA BADARIYYA NAGAR UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000003",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0003-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000022",
            "name": "MANGARA BADARIYYA NAGAR UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000022",
      "full_name": "ABDULLA ASADI NADWI",
      "mobile": "9747375433",
      "membership_number": "2026/4912",
      "member_positions": [
        {
          "id": "420850a1-cb87-4b35-bf5b-c37ba0f8b04a",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000022",
            "title": "IBAD CHAIRMAN",
            "sort_order": 22
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        },
        {
          "id": "e1ce5533-78c1-45ad-9862-df5254a0f9ff",
          "units": {
            "id": "00000000-0000-0000-0001-000000000006",
            "name": "CHAPPARAPPADAV UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000006",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0006-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000035",
            "name": "CHAPPARAPPADAV UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000023",
      "full_name": "SHAMMAS K",
      "mobile": "8590650124",
      "membership_number": "2026/4880",
      "member_positions": [
        {
          "id": "12a73e70-c4ca-4863-b5ba-0dd9746ad521",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000023",
            "title": "MEDIA CHAIRMAN",
            "sort_order": 23
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        },
        {
          "id": "66985e97-6dea-455c-87f4-d70ddaec002f",
          "units": null,
          "unit_id": null,
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "30000000-0000-0000-0000-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000002",
            "name": "PADAPPENGAD CLUSTER COMMITTEE",
            "level": "cluster"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000024",
      "full_name": "ASLAM C",
      "mobile": "9605202229",
      "membership_number": "2026/5595",
      "member_positions": [
        {
          "id": "f98bdf5d-f82f-4229-96b4-3f72328c29b3",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000024",
            "title": "SARGALAYAM CHAIRMAN",
            "sort_order": 24
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000025",
      "full_name": "MANSOOR ALI K P",
      "mobile": "9947602652",
      "membership_number": "2026/4947",
      "member_positions": [
        {
          "id": "31af6b3a-2a24-4ae1-9879-077029abc054",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000025",
            "title": "TREND CHAIRMAN",
            "sort_order": 25
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000026",
      "full_name": "MUTHALIB NOORANI",
      "mobile": "9847914412",
      "membership_number": "2026/4901",
      "member_positions": [
        {
          "id": "fe94e490-a53c-4d50-ad76-cb312ef5a4c1",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000026",
            "title": "VIQAYA CHAIRMAN",
            "sort_order": 26
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000027",
      "full_name": "NISAMUDDEEN P K",
      "mobile": "9747581763",
      "membership_number": "2026/5044",
      "member_positions": [
        {
          "id": "5fe5be07-a3e1-4411-bf32-6aa86d35af6c",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000027",
            "title": "CAMPUS CHAIRMAN",
            "sort_order": 27
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        },
        {
          "id": "f03288bd-5ca1-4091-877a-1b009e6a0e52",
          "units": {
            "id": "00000000-0000-0000-0001-000000000005",
            "name": "ELAMBERAM PARA UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000005",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0005-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000034",
            "name": "ELAMBERAM PARA UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000028",
      "full_name": "NABEEL IRFANIYYA",
      "mobile": "9072938597",
      "membership_number": null,
      "member_positions": [
        {
          "id": "8e23a29f-32ed-4510-add3-84ce5da396c7",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000028",
            "title": "THALABA CHAIRMAN",
            "sort_order": 28
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000029",
      "full_name": "MUHAMMED UVAIS AZHARI",
      "mobile": "8590861006",
      "membership_number": "2026/4357",
      "member_positions": [
        {
          "id": "2be36892-e707-4fed-98b0-144b220bc250",
          "units": null,
          "unit_id": null,
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "30000000-0000-0000-0000-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000002",
            "name": "PADAPPENGAD CLUSTER COMMITTEE",
            "level": "cluster"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000030",
      "full_name": "NIZAR K V",
      "mobile": "6235930479",
      "membership_number": "2026/5111",
      "member_positions": [
        {
          "id": "243d8c64-59d0-41f6-ab41-4b0fa9196e1f",
          "units": null,
          "unit_id": null,
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "30000000-0000-0000-0000-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000002",
            "name": "PADAPPENGAD CLUSTER COMMITTEE",
            "level": "cluster"
          }
        },
        {
          "id": "312c0630-413f-4c29-9fbb-7992b5047b9a",
          "units": {
            "id": "00000000-0000-0000-0001-000000000004",
            "name": "NADUVIL UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000004",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0004-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000033",
            "name": "NADUVIL UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000031",
      "full_name": "MUHAMMED SHAN K",
      "mobile": "8547864855",
      "membership_number": "2026/4978",
      "member_positions": [
        {
          "id": "326464b7-a597-45f3-b8fa-61bbc23704fd",
          "units": null,
          "unit_id": null,
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "30000000-0000-0000-0000-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000002",
            "name": "PADAPPENGAD CLUSTER COMMITTEE",
            "level": "cluster"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000051",
      "full_name": "MUHAMMAD MUBASHIR P M",
      "mobile": "7907946689",
      "membership_number": "2026/5430",
      "member_positions": [
        {
          "id": "5d4a1f96-52ee-4292-96e2-d5bacf288696",
          "units": {
            "id": "00000000-0000-0000-0002-000000000004",
            "name": "NEDUVOODE UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000004",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0004-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000013",
            "name": "NEDUVOODE UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000052",
      "full_name": "THABSHEER P M",
      "mobile": "7907255470",
      "membership_number": "2026/5364",
      "member_positions": [
        {
          "id": "03053cfd-2a26-46e3-a40a-2092824999b8",
          "units": {
            "id": "00000000-0000-0000-0002-000000000004",
            "name": "NEDUVOODE UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000004",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0004-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000013",
            "name": "NEDUVOODE UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000053",
      "full_name": "JASEEL KK",
      "mobile": "8547141582",
      "membership_number": "2026/5640",
      "member_positions": [
        {
          "id": "19e5f50d-30d8-43cf-a6c0-68897fc5fc9c",
          "units": {
            "id": "00000000-0000-0000-0002-000000000005",
            "name": "MUNNAMKUNNU UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000005",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0005-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000014",
            "name": "MUNNAMKUNNU UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000054",
      "full_name": "SHAFEEQ OM",
      "mobile": "8075292227",
      "membership_number": "2026/4907",
      "member_positions": [
        {
          "id": "056ff1e3-a6f4-40bc-a09f-764f761714f6",
          "units": {
            "id": "00000000-0000-0000-0002-000000000005",
            "name": "MUNNAMKUNNU UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000005",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0005-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000014",
            "name": "MUNNAMKUNNU UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000055",
      "full_name": "MUNAVIR CV",
      "mobile": "7025570986",
      "membership_number": "2026/5644",
      "member_positions": [
        {
          "id": "c04c29bd-1550-41d8-87a6-28533d66db76",
          "units": {
            "id": "00000000-0000-0000-0002-000000000005",
            "name": "MUNNAMKUNNU UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000005",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0005-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000014",
            "name": "MUNNAMKUNNU UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000056",
      "full_name": "ALTHAF PC",
      "mobile": "8281626606",
      "membership_number": "2026/5449",
      "member_positions": [
        {
          "id": "211d3828-f81b-4c0c-8aa1-08c97065cf44",
          "units": {
            "id": "00000000-0000-0000-0002-000000000005",
            "name": "MUNNAMKUNNU UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000005",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0005-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000014",
            "name": "MUNNAMKUNNU UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000057",
      "full_name": "ABI THAHIR V E",
      "mobile": "9747938093",
      "membership_number": "2026/5734",
      "member_positions": [
        {
          "id": "68197e21-0c80-44b8-806a-cbd5476a074d",
          "units": {
            "id": "00000000-0000-0000-0002-000000000006",
            "name": "KARUVANCHAL UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000006",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0006-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000015",
            "name": "KARUVANCHAL UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000058",
      "full_name": "MUHAMMED AJMAL E P",
      "mobile": "8086793507",
      "membership_number": "2026/5712",
      "member_positions": [
        {
          "id": "3cd42590-b581-412f-b040-6b579a856e62",
          "units": {
            "id": "00000000-0000-0000-0002-000000000006",
            "name": "KARUVANCHAL UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000006",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0006-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000015",
            "name": "KARUVANCHAL UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000059",
      "full_name": "MUHAMMED SAFWAN K A",
      "mobile": "9072814198",
      "membership_number": "2026/5720",
      "member_positions": [
        {
          "id": "d5f2e903-2b21-43bf-927e-35349aaf48d0",
          "units": {
            "id": "00000000-0000-0000-0002-000000000006",
            "name": "KARUVANCHAL UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000006",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0006-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000015",
            "name": "KARUVANCHAL UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000060",
      "full_name": "ZAKKARIYA HUDAWI",
      "mobile": "7034240285",
      "membership_number": "2026/4881",
      "member_positions": [
        {
          "id": "a1208c56-5f15-48ff-ab8c-21866ea3ee1d",
          "units": {
            "id": "00000000-0000-0000-0003-000000000001",
            "name": "PERUVANA UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000001",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0001-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000020",
            "name": "PERUVANA UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000061",
      "full_name": "MUHAMMAD SWALIH K M",
      "mobile": "8590177615",
      "membership_number": "2026/5676",
      "member_positions": [
        {
          "id": "e05b3892-ee80-409f-be9d-3c82eb1d197d",
          "units": {
            "id": "00000000-0000-0000-0003-000000000001",
            "name": "PERUVANA UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000001",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0001-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000020",
            "name": "PERUVANA UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000062",
      "full_name": "MUJITHABA MM",
      "mobile": "9526837885",
      "membership_number": "2026/5159",
      "member_positions": [
        {
          "id": "08bb67aa-f8f3-48b9-b983-3b902bfd93fb",
          "units": {
            "id": "00000000-0000-0000-0003-000000000001",
            "name": "PERUVANA UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000001",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0001-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000020",
            "name": "PERUVANA UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000063",
      "full_name": "ABDULLA OC",
      "mobile": "9061211254",
      "membership_number": "2026/5446",
      "member_positions": [
        {
          "id": "07bb7a42-3584-4e40-ae05-28036e04c6be",
          "units": {
            "id": "00000000-0000-0000-0003-000000000001",
            "name": "PERUVANA UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000001",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0001-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000020",
            "name": "PERUVANA UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000064",
      "full_name": "MUHAMMED SAYD RAHMANI",
      "mobile": "7025981986",
      "membership_number": "2026/4922",
      "member_positions": [
        {
          "id": "0ce13184-f64a-4a33-80ac-599980a9189a",
          "units": {
            "id": "00000000-0000-0000-0003-000000000002",
            "name": "ERUVATTI UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000002",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0002-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000021",
            "name": "ERUVATTI UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000065",
      "full_name": "MUHAMMED SHAFEEQUE PK",
      "mobile": "9446111193",
      "membership_number": "2026/5198",
      "member_positions": [
        {
          "id": "94ba13ef-ad5e-4b0d-ad0b-60e0d23e567b",
          "units": {
            "id": "00000000-0000-0000-0003-000000000002",
            "name": "ERUVATTI UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000002",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0002-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000021",
            "name": "ERUVATTI UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000066",
      "full_name": "NIZAMUDHEEN KV",
      "mobile": "9745557649",
      "membership_number": "2026/5285",
      "member_positions": [
        {
          "id": "b7fbc7fe-c607-49c9-b030-e9af1b746829",
          "units": {
            "id": "00000000-0000-0000-0003-000000000002",
            "name": "ERUVATTI UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000002",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0002-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000021",
            "name": "ERUVATTI UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000067",
      "full_name": "MUHAMMAD RAZI OK",
      "mobile": "8086271797",
      "membership_number": "2026/5356",
      "member_positions": [
        {
          "id": "90e15eb5-457d-4947-a530-77e4089fe7cf",
          "units": {
            "id": "00000000-0000-0000-0003-000000000002",
            "name": "ERUVATTI UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000002",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0002-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000021",
            "name": "ERUVATTI UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000068",
      "full_name": "MUHAMMED MUNAID K C",
      "mobile": "7510484552",
      "membership_number": "2026/4958",
      "member_positions": [
        {
          "id": "7781b946-20e6-4ecd-886b-cdee878b086d",
          "units": {
            "id": "00000000-0000-0000-0003-000000000003",
            "name": "MANGARA BADARIYYA NAGAR UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000003",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0003-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000022",
            "name": "MANGARA BADARIYYA NAGAR UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000069",
      "full_name": "ASSAINAR P",
      "mobile": "8589805429",
      "membership_number": "2026/5130",
      "member_positions": [
        {
          "id": "27047249-8318-43f9-877e-c27684f637d0",
          "units": {
            "id": "00000000-0000-0000-0003-000000000003",
            "name": "MANGARA BADARIYYA NAGAR UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000003",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0003-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000022",
            "name": "MANGARA BADARIYYA NAGAR UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000070",
      "full_name": "JASEEM K",
      "mobile": "9744390850",
      "membership_number": "2026/4957",
      "member_positions": [
        {
          "id": "92b4e5d0-f85d-4ffd-867a-30ce2cbce5e8",
          "units": {
            "id": "00000000-0000-0000-0003-000000000003",
            "name": "MANGARA BADARIYYA NAGAR UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000003",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0003-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000022",
            "name": "MANGARA BADARIYYA NAGAR UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000082",
      "full_name": "ANSAB CK",
      "mobile": "8848492409",
      "membership_number": "2026/5591",
      "member_positions": [
        {
          "id": "ad50bdb0-4210-4db3-9bb3-89b2b35fe7a0",
          "units": {
            "id": "00000000-0000-0000-0001-000000000003",
            "name": "PADAPPENGAD UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000003",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0003-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000032",
            "name": "PADAPPENGAD UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000001",
      "full_name": "JAMSHEER DARIMI PERUVANA",
      "mobile": "9746969716",
      "membership_number": "2026/4877",
      "member_positions": [
        {
          "id": "5878d25c-4033-40c4-a823-5def633dca82",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000002",
      "full_name": "MUHSIN MANNANI",
      "mobile": "7559950633",
      "membership_number": "2026/4879",
      "member_positions": [
        {
          "id": "9bfc2290-987e-4315-a65e-f0688907743a",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000003",
      "full_name": "SINSARULHAQ AP",
      "mobile": "9048386344",
      "membership_number": "2026/5179",
      "member_positions": [
        {
          "id": "f6bfb285-5e3a-4104-8ade-a130e6d7a5aa",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000004",
      "full_name": "MUHAJIR K",
      "mobile": "9744149743",
      "membership_number": "2026/4895",
      "member_positions": [
        {
          "id": "ff2a5c40-40bc-48f4-abdc-f3f7787b441a",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        },
        {
          "id": "3fdf167d-5087-48ac-be0b-834d8a9370a2",
          "units": {
            "id": "00000000-0000-0000-0001-000000000005",
            "name": "ELAMBERAM PARA UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000005",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0005-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000034",
            "name": "ELAMBERAM PARA UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000005",
      "full_name": "RIYAS K",
      "mobile": "9656221909",
      "membership_number": "2026/5093",
      "member_positions": [
        {
          "id": "24f395b8-cc46-47d4-8ecc-dbcfe56f1328",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000005",
            "title": "VICE PRESIDENT",
            "sort_order": 5
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000006",
      "full_name": "MUBASHEER K",
      "mobile": "6235846789",
      "membership_number": "2026/4930",
      "member_positions": [
        {
          "id": "ef9cadaa-8cf9-48e0-8f90-1f33dba45782",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000006",
            "title": "VICE PRESIDENT",
            "sort_order": 6
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000007",
      "full_name": "UMMER PERUVANA",
      "mobile": "9747130613",
      "membership_number": "2026/4919",
      "member_positions": [
        {
          "id": "6b2b3d1c-2be3-4678-ad64-06cb14a68cb7",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000007",
            "title": "VICE PRESIDENT",
            "sort_order": 7
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000008",
      "full_name": "MUHAMMAD RIYAS HAITHAMI",
      "mobile": "9562440338",
      "membership_number": "2026/4911",
      "member_positions": [
        {
          "id": "8148de1f-335b-4160-8b4f-f2f105fd504a",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000008",
            "title": "JOINT SECRETARY",
            "sort_order": 8
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000009",
      "full_name": "HAFIL MUHAMMED SHIBILI FAIZY",
      "mobile": "9747958523",
      "membership_number": "2026/4916",
      "member_positions": [
        {
          "id": "c2fb3901-e716-441a-9e4f-fc75e84f76b4",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000009",
            "title": "JOINT SECRETARY",
            "sort_order": 9
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000010",
      "full_name": "SHAHID OP",
      "mobile": "9847900075",
      "membership_number": "2026/5106",
      "member_positions": [
        {
          "id": "2b315979-5562-40fb-bc9a-acf790fca345",
          "units": null,
          "unit_id": null,
          "clusters": null,
          "positions": {
            "id": "10000000-0000-0000-0000-000000000010",
            "title": "JOINT SECRETARY",
            "sort_order": 10
          },
          "cluster_id": null,
          "committees": {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "CHAPPARAPPADAVU SKSSF ZONE COMMITTEE",
            "level": "zone"
          }
        },
        {
          "id": "a8c95f41-1e80-4f84-bb2b-30658ec913a0",
          "units": {
            "id": "00000000-0000-0000-0002-000000000001",
            "name": "KUTTAPARAMB UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000001",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0001-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000010",
            "name": "KUTTAPARAMB UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000036",
      "full_name": "SHAMEEL PH",
      "mobile": "9495055337",
      "membership_number": "2026/5113",
      "member_positions": [
        {
          "id": "2b77ffa3-f82e-417f-a29f-b649dc8107ff",
          "units": null,
          "unit_id": null,
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "30000000-0000-0000-0000-000000000005",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000003",
            "name": "KUTTAPARAMB CLUSTER COMMITTEE",
            "level": "cluster"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000037",
      "full_name": "MUHAMMAD ASHIK",
      "mobile": "7907988349",
      "membership_number": "2026/5330",
      "member_positions": [
        {
          "id": "e5c3ca97-d168-4e97-a404-b0ef04be2568",
          "units": null,
          "unit_id": null,
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "30000000-0000-0000-0000-000000000006",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000003",
            "name": "KUTTAPARAMB CLUSTER COMMITTEE",
            "level": "cluster"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000038",
      "full_name": "MUHAMMED AJNAS A M",
      "mobile": "8129466012",
      "membership_number": "2026/5681",
      "member_positions": [
        {
          "id": "4045d6b6-4c1c-4237-a68d-2e04bd827072",
          "units": null,
          "unit_id": null,
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "30000000-0000-0000-0000-000000000007",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000003",
            "name": "KUTTAPARAMB CLUSTER COMMITTEE",
            "level": "cluster"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000039",
      "full_name": "MUHAMMED ASLAM KM",
      "mobile": "9544676461",
      "membership_number": "2026/5670",
      "member_positions": [
        {
          "id": "3af6a6f4-b695-4b97-a458-da310f45b20d",
          "units": null,
          "unit_id": null,
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "30000000-0000-0000-0000-000000000008",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000003",
            "name": "KUTTAPARAMB CLUSTER COMMITTEE",
            "level": "cluster"
          }
        },
        {
          "id": "bd7f5e38-1060-47c8-9a73-44bafe7a3f15",
          "units": {
            "id": "00000000-0000-0000-0002-000000000001",
            "name": "KUTTAPARAMB UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000001",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0001-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000010",
            "name": "KUTTAPARAMB UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000032",
      "full_name": "SHAMSUDHEEN DARIMI P",
      "mobile": "7012328158",
      "membership_number": "2026/4959",
      "member_positions": [
        {
          "id": "2fb96832-04dc-4c46-9487-205afce59001",
          "units": null,
          "unit_id": null,
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "30000000-0000-0000-0000-000000000009",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000004",
            "name": "PERUMALABAD CLUSTER COMMITTEE",
            "level": "cluster"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000033",
      "full_name": "JUNAID OV",
      "mobile": "9645189049",
      "membership_number": "2026/4948",
      "member_positions": [
        {
          "id": "3c2014c8-b043-4bcf-936b-c5744184f100",
          "units": null,
          "unit_id": null,
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "30000000-0000-0000-0000-000000000010",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000004",
            "name": "PERUMALABAD CLUSTER COMMITTEE",
            "level": "cluster"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000034",
      "full_name": "MUHAMMED DARIMI",
      "mobile": "9744641003",
      "membership_number": "2026/4935",
      "member_positions": [
        {
          "id": "16824272-1704-4261-a000-ba2855d22797",
          "units": null,
          "unit_id": null,
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "30000000-0000-0000-0000-000000000011",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000004",
            "name": "PERUMALABAD CLUSTER COMMITTEE",
            "level": "cluster"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000035",
      "full_name": "MUBARAK RAHMAN",
      "mobile": "7902936883",
      "membership_number": "2026/5583",
      "member_positions": [
        {
          "id": "87a72ecb-03c2-41c8-9b74-cdb51e354b16",
          "units": null,
          "unit_id": null,
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "30000000-0000-0000-0000-000000000012",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000004",
            "name": "PERUMALABAD CLUSTER COMMITTEE",
            "level": "cluster"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000040",
      "full_name": "MUHAMMED RAASHID KV",
      "mobile": "9645242227",
      "membership_number": "2026/5672",
      "member_positions": [
        {
          "id": "89e91854-226e-4411-8c7b-72cec419aeeb",
          "units": {
            "id": "00000000-0000-0000-0002-000000000001",
            "name": "KUTTAPARAMB UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000001",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0001-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000010",
            "name": "KUTTAPARAMB UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000041",
      "full_name": "MUHAMMED ASHIQUE UV",
      "mobile": "7560895182",
      "membership_number": "2026/5397",
      "member_positions": [
        {
          "id": "3bd5cc79-2d31-4b87-9f9c-b80792cf42ed",
          "units": {
            "id": "00000000-0000-0000-0002-000000000002",
            "name": "RAYAROM UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000002",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0002-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000011",
            "name": "RAYAROM UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000042",
      "full_name": "ANSARY",
      "mobile": "9847387578",
      "membership_number": "2026/5408",
      "member_positions": [
        {
          "id": "919d7efd-2f82-42f5-9adc-e5733e1a40ee",
          "units": {
            "id": "00000000-0000-0000-0002-000000000002",
            "name": "RAYAROM UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000002",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0002-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000011",
            "name": "RAYAROM UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000043",
      "full_name": "MUHAMMED SIYAD",
      "mobile": "8590506845",
      "membership_number": "2026/5396",
      "member_positions": [
        {
          "id": "bdcb31b3-0284-4159-bb5c-7b8c7c4c3694",
          "units": {
            "id": "00000000-0000-0000-0002-000000000002",
            "name": "RAYAROM UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000002",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0002-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000011",
            "name": "RAYAROM UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000044",
      "full_name": "RAHIL",
      "mobile": "6282062103",
      "membership_number": "2026/5404",
      "member_positions": [
        {
          "id": "d42255b0-4d76-4240-8ba9-d973284974b2",
          "units": {
            "id": "00000000-0000-0000-0002-000000000002",
            "name": "RAYAROM UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000002",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0002-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000011",
            "name": "RAYAROM UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000045",
      "full_name": "MUHAMMAD SAFWAN PJ",
      "mobile": "8590663227",
      "membership_number": "2026/5370",
      "member_positions": [
        {
          "id": "33905708-b46a-47ab-81b7-2c918210cd0f",
          "units": {
            "id": "00000000-0000-0000-0002-000000000003",
            "name": "THADIKKADAV UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000003",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0003-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000012",
            "name": "THADIKKADAV UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000046",
      "full_name": "IRSHAD M",
      "mobile": "9207677087",
      "membership_number": "2026/5332",
      "member_positions": [
        {
          "id": "eb3c1131-ca58-49db-a736-300efa6c5530",
          "units": {
            "id": "00000000-0000-0000-0002-000000000003",
            "name": "THADIKKADAV UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000003",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0003-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000012",
            "name": "THADIKKADAV UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000047",
      "full_name": "MUHAMMAD RAYEES C",
      "mobile": "7902825052",
      "membership_number": "2026/5381",
      "member_positions": [
        {
          "id": "e865f77d-d082-4e8f-8b4f-9fef9551153f",
          "units": {
            "id": "00000000-0000-0000-0002-000000000003",
            "name": "THADIKKADAV UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000003",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0003-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000012",
            "name": "THADIKKADAV UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000048",
      "full_name": "NIHAL MUHAMMAD",
      "mobile": "8848445813",
      "membership_number": "2026/5422",
      "member_positions": [
        {
          "id": "449640e6-1070-48ff-8f76-f755b5184396",
          "units": {
            "id": "00000000-0000-0000-0002-000000000003",
            "name": "THADIKKADAV UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000003",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0003-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000012",
            "name": "THADIKKADAV UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000049",
      "full_name": "SHUHAIR P",
      "mobile": "9544157991",
      "membership_number": "2026/5055",
      "member_positions": [
        {
          "id": "aabae3d2-727c-4210-934d-3dbae763a899",
          "units": {
            "id": "00000000-0000-0000-0002-000000000004",
            "name": "NEDUVOODE UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000004",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0004-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000013",
            "name": "NEDUVOODE UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000050",
      "full_name": "MUHAMMED ASHIF P A",
      "mobile": "9188304316",
      "membership_number": "2026/5012",
      "member_positions": [
        {
          "id": "2b6cf539-69b3-44b8-aadd-995e28818b1c",
          "units": {
            "id": "00000000-0000-0000-0002-000000000004",
            "name": "NEDUVOODE UNIT",
            "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549"
          },
          "unit_id": "00000000-0000-0000-0002-000000000004",
          "clusters": {
            "id": "82a5343b-7c51-4276-a398-7e86db294549",
            "code": "KUT",
            "name": "KUTTAPARAMB CLUSTER"
          },
          "positions": {
            "id": "40000000-0000-0000-0004-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "82a5343b-7c51-4276-a398-7e86db294549",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000013",
            "name": "NEDUVOODE UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000071",
      "full_name": "RASHID ASADI",
      "mobile": "9744355613",
      "membership_number": "2026/4949",
      "member_positions": [
        {
          "id": "ff0f539b-8d07-4001-bef0-a9cc16d77422",
          "units": {
            "id": "00000000-0000-0000-0003-000000000004",
            "name": "PERUMALABAD UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000004",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0004-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000023",
            "name": "PERUMALABAD UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000072",
      "full_name": "JALEEL FAISY IRFANI",
      "mobile": "9961292787",
      "membership_number": "2026/5645",
      "member_positions": [
        {
          "id": "85a01225-693d-4750-bc06-8f49c85f28ca",
          "units": {
            "id": "00000000-0000-0000-0003-000000000004",
            "name": "PERUMALABAD UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000004",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0004-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000023",
            "name": "PERUMALABAD UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000073",
      "full_name": "MUHAMMED ADIB VV",
      "mobile": "8848783075",
      "membership_number": "2026/4953",
      "member_positions": [
        {
          "id": "a52a39ac-b2f1-4f46-80e2-96a364eb58e8",
          "units": {
            "id": "00000000-0000-0000-0003-000000000004",
            "name": "PERUMALABAD UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000004",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0004-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000023",
            "name": "PERUMALABAD UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000074",
      "full_name": "SALEEM ASADI",
      "mobile": "8590747494",
      "membership_number": "2026/4950",
      "member_positions": [
        {
          "id": "080a73e5-a68b-4f8a-b9f7-5cf8937ba885",
          "units": {
            "id": "00000000-0000-0000-0003-000000000004",
            "name": "PERUMALABAD UNIT",
            "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1"
          },
          "unit_id": "00000000-0000-0000-0003-000000000004",
          "clusters": {
            "id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
            "code": "PER",
            "name": "PERUMALABAD CLUSTER"
          },
          "positions": {
            "id": "60000000-0000-0000-0004-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "cb28397d-2e72-4064-bfe5-2a94aec5dbd1",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000023",
            "name": "PERUMALABAD UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000075",
      "full_name": "KHALIFA BIN ABDULL FATHAH",
      "mobile": "7510648318",
      "membership_number": "2026/5162",
      "member_positions": [
        {
          "id": "a8494788-fb8b-47d8-9c3c-92678106e900",
          "units": {
            "id": "00000000-0000-0000-0001-000000000001",
            "name": "SHANTHIGIRI UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000001",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0001-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000030",
            "name": "SHANTHIGIRI UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000076",
      "full_name": "HAMDHAN HYDER",
      "mobile": "7510945363",
      "membership_number": "2026/4933",
      "member_positions": [
        {
          "id": "b59ef852-2201-4a5c-a6c1-625349134295",
          "units": {
            "id": "00000000-0000-0000-0001-000000000001",
            "name": "SHANTHIGIRI UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000001",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0001-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000030",
            "name": "SHANTHIGIRI UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000077",
      "full_name": "MUHAMMED SHAHID P",
      "mobile": "9544152585",
      "membership_number": "2026/4941",
      "member_positions": [
        {
          "id": "a3889565-19c3-4044-8186-8bc1fa4dded1",
          "units": {
            "id": "00000000-0000-0000-0001-000000000001",
            "name": "SHANTHIGIRI UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000001",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0001-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000030",
            "name": "SHANTHIGIRI UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000078",
      "full_name": "ANWAR KAMIL AL ASHARI",
      "mobile": "8547994808",
      "membership_number": "2026/5051",
      "member_positions": [
        {
          "id": "3643e6a1-b0a4-4155-bd04-78c05bdca3e8",
          "units": {
            "id": "00000000-0000-0000-0001-000000000002",
            "name": "VILAKKANNOOR UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000002",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0002-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000031",
            "name": "VILAKKANNOOR UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000079",
      "full_name": "AJNAS KP",
      "mobile": "9744597523",
      "membership_number": "2026/5053",
      "member_positions": [
        {
          "id": "506a8720-42c0-4b83-8b20-878c4d64bb6b",
          "units": {
            "id": "00000000-0000-0000-0001-000000000002",
            "name": "VILAKKANNOOR UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000002",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0002-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000031",
            "name": "VILAKKANNOOR UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000080",
      "full_name": "ASSAIN K",
      "mobile": "9446773627",
      "membership_number": "2026/5472",
      "member_positions": [
        {
          "id": "657a29e8-3ba3-41af-979d-915a4bb9cc20",
          "units": {
            "id": "00000000-0000-0000-0001-000000000002",
            "name": "VILAKKANNOOR UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000002",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0002-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000031",
            "name": "VILAKKANNOOR UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000081",
      "full_name": "ABDUL RASHEED KP",
      "mobile": "9605203476",
      "membership_number": "2026/5631",
      "member_positions": [
        {
          "id": "f65acecc-f22c-44a8-a6ab-db1a575edb60",
          "units": {
            "id": "00000000-0000-0000-0001-000000000002",
            "name": "VILAKKANNOOR UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000002",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0002-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000031",
            "name": "VILAKKANNOOR UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000083",
      "full_name": "MUHAMMED YASEEN K",
      "mobile": "6235225975",
      "membership_number": "2026/4928",
      "member_positions": [
        {
          "id": "ff15b899-0dd0-41ec-bc43-713a5f6ab14c",
          "units": {
            "id": "00000000-0000-0000-0001-000000000003",
            "name": "PADAPPENGAD UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000003",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0003-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000032",
            "name": "PADAPPENGAD UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000084",
      "full_name": "BASIL N",
      "mobile": "9074909740",
      "membership_number": "2026/5196",
      "member_positions": [
        {
          "id": "b15f1ea3-0b13-4a65-9184-c9989b9ab4cd",
          "units": {
            "id": "00000000-0000-0000-0001-000000000003",
            "name": "PADAPPENGAD UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000003",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0003-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000032",
            "name": "PADAPPENGAD UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000085",
      "full_name": "MOHAMED ARSHAD",
      "mobile": "8330822193",
      "membership_number": "2026/4883",
      "member_positions": [
        {
          "id": "7c09edee-65ee-4013-89e4-0d6b979f1a0a",
          "units": {
            "id": "00000000-0000-0000-0001-000000000004",
            "name": "NADUVIL UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000004",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0004-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000033",
            "name": "NADUVIL UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000086",
      "full_name": "MUHAMMED NAFIH K",
      "mobile": "6235264373",
      "membership_number": "2026/5099",
      "member_positions": [
        {
          "id": "4a819892-ec96-4a70-a358-bec0268b2e6f",
          "units": {
            "id": "00000000-0000-0000-0001-000000000004",
            "name": "NADUVIL UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000004",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0004-000000000002",
            "title": "GENERAL SECRETARY",
            "sort_order": 2
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000033",
            "name": "NADUVIL UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000087",
      "full_name": "ISMAL MP",
      "mobile": "9562044970",
      "membership_number": "2026/5043",
      "member_positions": [
        {
          "id": "02387c62-233d-4fcf-a7f0-7e4a55732345",
          "units": {
            "id": "00000000-0000-0000-0001-000000000004",
            "name": "NADUVIL UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000004",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0004-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000033",
            "name": "NADUVIL UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000088",
      "full_name": "NAVAF ARIF",
      "mobile": "9048778074",
      "membership_number": "2026/4997",
      "member_positions": [
        {
          "id": "11e6bca6-8361-4dc5-8d22-30331fb403d3",
          "units": {
            "id": "00000000-0000-0000-0001-000000000005",
            "name": "ELAMBERAM PARA UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000005",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0005-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000034",
            "name": "ELAMBERAM PARA UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000089",
      "full_name": "FAHEEM P K",
      "mobile": "9656986775",
      "membership_number": "2026/4971",
      "member_positions": [
        {
          "id": "3cc5a93d-6372-475d-b192-8d36ed037c78",
          "units": {
            "id": "00000000-0000-0000-0001-000000000005",
            "name": "ELAMBERAM PARA UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000005",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0005-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000034",
            "name": "ELAMBERAM PARA UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000090",
      "full_name": "MINHAJ M",
      "mobile": "9605725522",
      "membership_number": "2026/5058",
      "member_positions": [
        {
          "id": "454dc6c1-a9c6-4f6c-af7d-9e5f64182780",
          "units": {
            "id": "00000000-0000-0000-0001-000000000006",
            "name": "CHAPPARAPPADAV UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000006",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0006-000000000001",
            "title": "PRESIDENT",
            "sort_order": 1
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000035",
            "name": "CHAPPARAPPADAV UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000091",
      "full_name": "MUHAMMED SINAN K",
      "mobile": "9188060513",
      "membership_number": "2026/5301",
      "member_positions": [
        {
          "id": "fa85d758-ce78-48df-b253-5be096be5eae",
          "units": {
            "id": "00000000-0000-0000-0001-000000000006",
            "name": "CHAPPARAPPADAV UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000006",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0006-000000000003",
            "title": "TREASURER",
            "sort_order": 3
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000035",
            "name": "CHAPPARAPPADAV UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    },
    {
      "id": "20000000-0000-0000-0000-000000000092",
      "full_name": "MUHAMMED HASSAN C P",
      "mobile": "9656166030",
      "membership_number": "2026/4993",
      "member_positions": [
        {
          "id": "0398dcd5-0b84-49a1-9f03-3d35234ea935",
          "units": {
            "id": "00000000-0000-0000-0001-000000000006",
            "name": "CHAPPARAPPADAV UNIT",
            "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b"
          },
          "unit_id": "00000000-0000-0000-0001-000000000006",
          "clusters": {
            "id": "d60804b7-461f-4202-bd40-06168389d25b",
            "code": "PAD",
            "name": "PADAPPENGAD CLUSTER"
          },
          "positions": {
            "id": "50000000-0000-0000-0006-000000000004",
            "title": "WORKING SECRETARY",
            "sort_order": 4
          },
          "cluster_id": "d60804b7-461f-4202-bd40-06168389d25b",
          "committees": {
            "id": "00000000-0000-0000-0000-000000000035",
            "name": "CHAPPARAPPADAV UNIT COMMITTEE",
            "level": "unit"
          }
        }
      ]
    }
  ]
}
