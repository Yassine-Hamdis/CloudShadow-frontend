import { useState }  from 'react'
import toast          from 'react-hot-toast'
import { createUser } from '../../api/users'
import { X, Eye, EyeOff } from 'lucide-react'

export default function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ email: '', password: '', role: 'USER' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.email.trim())   errs.email    = 'Email is required'
    if (!form.password)       errs.password = 'Password is required'
    if (form.password?.length < 6)
      errs.password = 'Min 6 characters'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const user = await createUser(form)
      toast.success(`User ${user.email} created!`)
      onCreated(user)
      onClose()
    } catch (err) {
      const status  = err.response?.status
      const payload = err.response?.data

      if (status === 409) {
        setErrors({ email: 'Email already in use' })
      } else if (status === 400 && payload?.validationErrors) {
        const fe = {}
        payload.validationErrors.forEach(({ field, message }) => { fe[field] = message })
        setErrors(fe)
      } else {
        toast.error('Failed to create user')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1f2937] border border-[#374151] rounded-[1.75rem] w-full max-w-sm shadow-2xl app-panel-soft overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#374151]/70">
          <h2 className="text-base font-semibold text-[#E6EEF2]">Add New User</h2>
          <button onClick={onClose} className="text-[#9AA6B2] hover:text-[#E6EEF2]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Email */}
          <div>
            <label className="app-label">
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="user@company.com"
              className={`
                app-input w-full bg-[#0f1724] border
                text-[#E6EEF2] placeholder:text-[#374151] text-sm
                focus:outline-none focus:ring-2 focus:ring-[#3f51b5]/45
                ${errors.email ? 'border-[#E53935]' : 'border-[#374151]'}
              `}
            />
            {errors.email && <p className="text-xs text-[#E53935] mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="app-label">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                className={`
                  app-input w-full pr-10 bg-[#0f1724] border
                  text-[#E6EEF2] placeholder:text-[#374151] text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#3f51b5]/45
                  ${errors.password ? 'border-[#E53935]' : 'border-[#374151]'}
                `}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA6B2]"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-[#E53935] mt-1">{errors.password}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="app-label">
              Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="
                app-input w-full bg-[#0f1724]
                border border-[#374151] text-[#E6EEF2] text-sm
                focus:outline-none focus:ring-2 focus:ring-[#3f51b5]/45
              "
            >
              <option value="USER">USER — Read-only access</option>
              <option value="ADMIN">ADMIN — Full access</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="
                app-button-sm text-sm font-medium
                border border-[#374151] text-[#9AA6B2]
                hover:text-[#E6EEF2] hover:border-[#4b5563] transition-all
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`
                app-button-sm text-sm font-medium
                bg-[#3f51b5] hover:bg-[#3949a3] text-white transition-all
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </span>
              ) : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}