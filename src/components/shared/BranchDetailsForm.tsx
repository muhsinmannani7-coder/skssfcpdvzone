import { useState, useEffect } from 'react'
import { supabase, type BranchProfile, type CommitteeMemberItem } from '@/lib/supabase'
import {
  Save, Plus, Trash2,
  CheckCircle2, AlertCircle, Send
} from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  unitId: string
  unitName: string
  isSecretaryView?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

export default function BranchDetailsForm({
  unitId,
  unitName,
  isSecretaryView = false,
  onSuccess,
  onCancel,
}: Props) {
  const [activeTab, setActiveTab] = useState<'branch' | 'mahallu' | 'committee' | 'activities'>('branch')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form State
  const [nameMl, setNameMl] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [location, setLocation] = useState('')
  const [address, setAddress] = useState('')
  const [presidentName, setPresidentName] = useState('')
  const [presidentMobile, setPresidentMobile] = useState('')
  const [secretaryName, setSecretaryName] = useState('')
  const [secretaryMobile, setSecretaryMobile] = useState('')
  const [treasurerName, setTreasurerName] = useState('')
  const [treasurerMobile, setTreasurerMobile] = useState('')
  const [workingSecName, setWorkingSecName] = useState('')
  const [workingSecMobile, setWorkingSecMobile] = useState('')

  // Mahallu
  const [mahalluName, setMahalluName] = useState('')
  const [mahalluPresidentName, setMahalluPresidentName] = useState('')
  const [mahalluPresidentMobile, setMahalluPresidentMobile] = useState('')
  const [mahalluSecretaryName, setMahalluSecretaryName] = useState('')
  const [mahalluSecretaryMobile, setMahalluSecretaryMobile] = useState('')
  const [masjidDetails, setMasjidDetails] = useState('')
  const [otherOfficeBearers, setOtherOfficeBearers] = useState('')

  // Committee list
  const [committeeList, setCommitteeList] = useState<CommitteeMemberItem[]>([])
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberPosition, setNewMemberPosition] = useState('')
  const [newMemberMobile, setNewMemberMobile] = useState('')

  // Additional stats & activities
  const [totalMembers, setTotalMembers] = useState<number>(0)
  const [activeWorkers, setActiveWorkers] = useState<number>(0)
  const [meetingDetails, setMeetingDetails] = useState('')
  const [orgActivities, setOrgActivities] = useState('')
  const [eduActivities, setEduActivities] = useState('')
  const [socialActivities, setSocialActivities] = useState('')
  const [notes, setNotes] = useState('')
  const [profileStatus, setProfileStatus] = useState<'draft' | 'submitted' | 'approved'>('draft')

  // Load existing profile
  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      const { data, error } = await supabase
        .from('branch_profiles')
        .select('*')
        .eq('unit_id', unitId)
        .maybeSingle()

      if (!error && data) {
        const p = data as BranchProfile
        setNameMl(p.name_ml || '')
        setNameEn(p.name_en || '')
        setLocation(p.location || '')
        setAddress(p.address || '')
        setPresidentName(p.president_name || '')
        setPresidentMobile(p.president_mobile || '')
        setSecretaryName(p.secretary_name || '')
        setSecretaryMobile(p.secretary_mobile || '')
        setTreasurerName(p.treasurer_name || '')
        setTreasurerMobile(p.treasurer_mobile || '')
        setWorkingSecName(p.working_sec_name || '')
        setWorkingSecMobile(p.working_sec_mobile || '')

        setMahalluName(p.mahallu_name || '')
        setMahalluPresidentName(p.mahallu_president_name || '')
        setMahalluPresidentMobile(p.mahallu_president_mobile || '')
        setMahalluSecretaryName(p.mahallu_secretary_name || '')
        setMahalluSecretaryMobile(p.mahallu_secretary_mobile || '')
        setMasjidDetails(p.masjid_details || '')
        setOtherOfficeBearers(p.other_office_bearers || '')

        setCommitteeList(Array.isArray(p.committee_members_list) ? p.committee_members_list : [])
        setTotalMembers(p.total_members || 0)
        setActiveWorkers(p.active_workers || 0)
        setMeetingDetails(p.meeting_details || '')
        setOrgActivities(p.organizational_activities || '')
        setEduActivities(p.educational_activities || '')
        setSocialActivities(p.social_service_activities || '')
        setNotes(p.notes || '')
        setProfileStatus(p.profile_status || 'draft')
      }
      setLoading(false)
    }
    loadProfile()
  }, [unitId])

  const addCommitteeMember = () => {
    if (!newMemberName.trim()) return
    setCommitteeList([
      ...committeeList,
      {
        name: newMemberName.trim(),
        position: newMemberPosition.trim() || 'കമ്മിറ്റി അംഗം',
        mobile: newMemberMobile.trim() || undefined,
      },
    ])
    setNewMemberName('')
    setNewMemberPosition('')
    setNewMemberMobile('')
  }

  const removeCommitteeMember = (index: number) => {
    setCommitteeList(committeeList.filter((_, i) => i !== index))
  }

  const handleSave = async (submitForApproval = false) => {
    setSaving(true)
    setNotification(null)

    const newStatus = submitForApproval
      ? 'submitted'
      : isSecretaryView && profileStatus === 'approved'
      ? 'approved'
      : profileStatus

    const payload: Partial<BranchProfile> = {
      unit_id: unitId,
      name_ml: nameMl.trim() || null,
      name_en: nameEn.trim() || null,
      location: location.trim() || null,
      address: address.trim() || null,
      president_name: presidentName.trim() || null,
      president_mobile: presidentMobile.trim() || null,
      secretary_name: secretaryName.trim() || null,
      secretary_mobile: secretaryMobile.trim() || null,
      treasurer_name: treasurerName.trim() || null,
      treasurer_mobile: treasurerMobile.trim() || null,
      working_sec_name: workingSecName.trim() || null,
      working_sec_mobile: workingSecMobile.trim() || null,

      mahallu_name: mahalluName.trim() || null,
      mahallu_president_name: mahalluPresidentName.trim() || null,
      mahallu_president_mobile: mahalluPresidentMobile.trim() || null,
      mahallu_secretary_name: mahalluSecretaryName.trim() || null,
      mahallu_secretary_mobile: mahalluSecretaryMobile.trim() || null,
      masjid_details: masjidDetails.trim() || null,
      other_office_bearers: otherOfficeBearers.trim() || null,

      committee_members_list: committeeList,
      total_members: Number(totalMembers) || 0,
      active_workers: Number(activeWorkers) || 0,
      meeting_details: meetingDetails.trim() || null,
      organizational_activities: orgActivities.trim() || null,
      educational_activities: eduActivities.trim() || null,
      social_service_activities: socialActivities.trim() || null,
      notes: notes.trim() || null,
      profile_status: newStatus,
      submitted_at: submitForApproval ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('branch_profiles')
      .upsert(payload, { onConflict: 'unit_id' })

    setSaving(false)
    if (error) {
      setNotification({ type: 'error', message: error.message || 'Error saving' })
    } else {
      setNotification({
        type: 'success',
        message: submitForApproval
          ? 'വിവരങ്ങൾ മേൽനോട്ടത്തിനായി സമർപ്പിച്ചു (Submitted for Approval)!'
          : 'വിവരങ്ങൾ വിജയകരമായി സേവ് ചെയ്തു!',
      })
      if (submitForApproval) setProfileStatus('submitted')
      if (onSuccess) onSuccess()
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-surface-400">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin mx-auto mb-2" />
        <span>വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              {profileStatus.toUpperCase()}
            </span>
            <h2 className="text-lg font-black text-surface-900">{unitName}</h2>
          </div>
          <p className="text-xs text-surface-500 mt-0.5">
            ശാഖ, മഹല്ല്, കമ്മിറ്റി ഭാരവാഹികൾ, പ്രവർത്തനങ്ങൾ എന്നിവയുടെ സമഗ്ര ഫോം
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-2xl overflow-x-auto text-xs font-bold">
          {[
            { id: 'branch', label: 'ശാഖാ വിവരങ്ങൾ' },
            { id: 'mahallu', label: 'മഹല്ല് വിവരങ്ങൾ' },
            { id: 'committee', label: 'കമ്മിറ്റി അംഗങ്ങൾ' },
            { id: 'activities', label: 'പ്രവർത്തനങ്ങൾ' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={clsx(
                'px-3 py-1.5 rounded-xl transition whitespace-nowrap',
                activeTab === t.id
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-surface-600 hover:text-surface-900'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {notification && (
        <div
          className={clsx(
            'p-4 rounded-xl flex items-center gap-2 text-xs font-semibold',
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* ── TAB 1: Branch Details ── */}
      {activeTab === 'branch' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                ശാഖയുടെ പേര് (മലയാളത്തിൽ)
              </label>
              <input
                type="text"
                placeholder="ഉദാ: പടപ്പേങ്ങാട് ശാഖ"
                value={nameMl}
                onChange={(e) => setNameMl(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                Branch Name (In English)
              </label>
              <input
                type="text"
                placeholder="e.g. PADAPPENGAD UNIT"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                ലൊക്കേഷൻ / പ്രദേശം (Location)
              </label>
              <input
                type="text"
                placeholder="സ്ഥലം..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                ഓഫീസ് വിലാസം (Address)
              </label>
              <input
                type="text"
                placeholder="വിലാസം..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* President */}
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                ശാഖാ പ്രസിഡന്റ് പേര്
              </label>
              <input
                type="text"
                placeholder="പ്രസിഡന്റ് പേര്..."
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                പ്രസിഡന്റ് മൊബൈൽ നമ്പർ
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                value={presidentMobile}
                onChange={(e) => setPresidentMobile(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Secretary */}
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                ജനറൽ സെക്രട്ടറി പേര്
              </label>
              <input
                type="text"
                placeholder="സെക്രട്ടറി പേര്..."
                value={secretaryName}
                onChange={(e) => setSecretaryName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                സെക്രട്ടറി മൊബൈൽ നമ്പർ
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                value={secretaryMobile}
                onChange={(e) => setSecretaryMobile(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Treasurer */}
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                ട്രഷറർ പേര്
              </label>
              <input
                type="text"
                placeholder="ട്രഷറർ പേര്..."
                value={treasurerName}
                onChange={(e) => setTreasurerName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                ട്രഷറർ മൊബൈൽ നമ്പർ
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                value={treasurerMobile}
                onChange={(e) => setTreasurerMobile(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Working Secretary */}
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                വർക്കിംഗ് സെക്രട്ടറി പേര്
              </label>
              <input
                type="text"
                placeholder="വർക്കിംഗ് സെക്രട്ടറി..."
                value={workingSecName}
                onChange={(e) => setWorkingSecName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                വർക്കിംഗ് സെക്രട്ടറി മൊബൈൽ നമ്പർ
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                value={workingSecMobile}
                onChange={(e) => setWorkingSecMobile(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Mahallu Details ── */}
      {activeTab === 'mahallu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1">
                മഹല്ലിന്റെ പേര് (Mahallu Name)
              </label>
              <input
                type="text"
                placeholder="ഉദാ: പടപ്പേങ്ങാട് ജുമാ മസ്ജിദ് മഹല്ല്..."
                value={mahalluName}
                onChange={(e) => setMahalluName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                മഹല്ല് പ്രസിഡന്റ് പേര്
              </label>
              <input
                type="text"
                placeholder="പേര്..."
                value={mahalluPresidentName}
                onChange={(e) => setMahalluPresidentName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                മഹല്ല് പ്രസിഡന്റ് മൊബൈൽ നമ്പർ
              </label>
              <input
                type="tel"
                placeholder="ഫോൺ നമ്പർ..."
                value={mahalluPresidentMobile}
                onChange={(e) => setMahalluPresidentMobile(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                മഹല്ല് സെക്രട്ടറി പേര്
              </label>
              <input
                type="text"
                placeholder="പേര്..."
                value={mahalluSecretaryName}
                onChange={(e) => setMahalluSecretaryName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                മഹല്ല് സെക്രട്ടറി മൊബൈൽ നമ്പർ
              </label>
              <input
                type="tel"
                placeholder="ഫോൺ നമ്പർ..."
                value={mahalluSecretaryMobile}
                onChange={(e) => setMahalluSecretaryMobile(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1">
                മസ്ജിദ് വിവരങ്ങൾ (Masjid Details)
              </label>
              <textarea
                rows={2}
                placeholder="ജുമാ മസ്ജിദ്, നിസ്കാര പള്ളികൾ, ഖതീബ് / ഇമാം വിവരങ്ങൾ..."
                value={masjidDetails}
                onChange={(e) => setMasjidDetails(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1">
                മറ്റ് പ്രധാന ഭാരവാഹികൾ / പണ്ഡിതർ (Other Office Bearers)
              </label>
              <textarea
                rows={2}
                placeholder="ഖാസി, ഉസ്താദുമാർ, ട്രഷറർ തുടങ്ങിയ വിവരങ്ങൾ..."
                value={otherOfficeBearers}
                onChange={(e) => setOtherOfficeBearers(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Committee Members ── */}
      {activeTab === 'committee' && (
        <div className="space-y-4">
          <div className="bg-surface-50 p-4 rounded-2xl border border-surface-200 space-y-3">
            <h4 className="font-bold text-xs text-surface-800 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>കമ്മിറ്റി അംഗത്തെ ചേർക്കുക (Add Committee Member)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="അംഗത്തിന്റെ പേര് *"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-surface-200 bg-white"
              />
              <input
                type="text"
                placeholder="സ്ഥാനം (Position - e.g. വൈസ് പ്രസിഡന്റ്)"
                value={newMemberPosition}
                onChange={(e) => setNewMemberPosition(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-surface-200 bg-white"
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="മൊബൈൽ നമ്പർ"
                  value={newMemberMobile}
                  onChange={(e) => setNewMemberMobile(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-white"
                />
                <button
                  type="button"
                  onClick={addCommitteeMember}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex-shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Committee List Table */}
          <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-surface-50 border-b border-surface-200 text-xs font-bold text-surface-700">
              നിലവിലെ അംഗങ്ങൾ ({committeeList.length})
            </div>
            {committeeList.length === 0 ? (
              <div className="p-6 text-center text-xs text-surface-400">
                കമ്മിറ്റി അംഗങ്ങളെ ചേർത്തിട്ടില്ല
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {committeeList.map((m, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-surface-50">
                    <div>
                      <span className="font-bold text-surface-900">{m.name}</span>
                      <span className="text-surface-400 ml-2">({m.position})</span>
                      {m.mobile && <span className="text-surface-500 ml-3">📞 {m.mobile}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCommitteeMember(idx)}
                      className="p-1 rounded text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: Activities & Reports ── */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                ആകെ ശാഖാ മെമ്പർമാർ (Total Members)
              </label>
              <input
                type="number"
                min={0}
                value={totalMembers}
                onChange={(e) => setTotalMembers(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                സജീവ പ്രവർത്തകർ (Active Cadres)
              </label>
              <input
                type="number"
                min={0}
                value={activeWorkers}
                onChange={(e) => setActiveWorkers(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1">
                കമ്മിറ്റി മീറ്റിംഗ് വിവരങ്ങൾ (Meeting Details)
              </label>
              <textarea
                rows={2}
                placeholder="സാധാരണ മീറ്റിംഗ് ചേരുന്ന തീയതി, സ്ഥലം..."
                value={meetingDetails}
                onChange={(e) => setMeetingDetails(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1">
                സംഘടനാ പ്രവർത്തനങ്ങൾ (Organizational Activities)
              </label>
              <textarea
                rows={2}
                placeholder="ശാഖയിൽ നടത്തിയ പ്രധാന സംഘടനാ പ്രവർത്തനങ്ങൾ..."
                value={orgActivities}
                onChange={(e) => setOrgActivities(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1">
                വിദ്യാഭ്യാസ പ്രവർത്തനങ്ങൾ (Educational Activities)
              </label>
              <textarea
                rows={2}
                placeholder="ട്യൂഷൻ ക്ലാസുകൾ, എഡ്യൂവിഷൻ, മദ്റസ ശാക്തീകരണം..."
                value={eduActivities}
                onChange={(e) => setEduActivities(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1">
                സാന്ത്വന / ജീവകാരുണ്യ പ്രവർത്തനങ്ങൾ (Social Service Activities)
              </label>
              <textarea
                rows={2}
                placeholder="ബ്ലഡ് ഡൊണേഷൻ, സഹചാരി സഹായങ്ങൾ, റിലീഫ്..."
                value={socialActivities}
                onChange={(e) => setSocialActivities(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1">
                പ്രത്യേക കുറിപ്പുകൾ (Important Notes)
              </label>
              <textarea
                rows={2}
                placeholder="മേഖലാ കമ്മിറ്റിയുടെ ശ്രദ്ധയിൽപ്പെടുത്തേണ്ട കാര്യങ്ങൾ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-200">
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-surface-200 text-xs font-semibold text-surface-600 hover:bg-surface-50"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Save Draft */}
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>ഡ്രാഫ്റ്റ് സേവ് ചെയ്യുക</span>
          </button>

          {/* Submit / Approve */}
          {isSecretaryView ? (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>മേഖലയിലേക്ക് സമർപ്പിക്കുക (Submit)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                setProfileStatus('approved')
                await handleSave(false)
              }}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>അംഗീകരിക്കുക & സേവ് ചെയ്യുക (Approve)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
