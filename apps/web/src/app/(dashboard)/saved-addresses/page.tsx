'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MapPin, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { COUNTRIES, countryUsesPostcode, validatePostcode } from '@/lib/countries';

const AU_STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' },
];

interface SavedAddress {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  postcode: string;
  country: string;
  isDefault: boolean;
}

interface AddressForm {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  isDefault: boolean;
}

const blankForm: AddressForm = {
  firstName: '',
  lastName: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postcode: '',
  country: 'AU',
  isDefault: false,
};

function toForm(address: SavedAddress): AddressForm {
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    address1: address.address1,
    address2: address.address2 ?? '',
    city: address.city,
    state: address.state,
    postcode: address.postcode,
    country: address.country,
    isDefault: address.isDefault,
  };
}

export default function SavedAddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [form, setForm] = useState<AddressForm>(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editingAddress = useMemo(
    () => addresses.find((address) => address.id === editingId) ?? null,
    [addresses, editingId],
  );

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ data: SavedAddress[] }>('/users/me/addresses');
      setAddresses(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved addresses');
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setEditingId(null);
    setForm({ ...blankForm, isDefault: addresses.length === 0 });
    setShowForm(true);
    setError(null);
  }

  function startEdit(address: SavedAddress) {
    setEditingId(address.id);
    setForm(toForm(address));
    setShowForm(true);
    setError(null);
  }

  function updateField(field: keyof AddressForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateForm(): string | null {
    if (!form.firstName.trim()) return 'First name is required';
    if (!form.lastName.trim()) return 'Last name is required';
    if (!form.address1.trim()) return 'Address line 1 is required';
    if (!form.city.trim()) return 'City is required';
    // State required only for Australia; optional elsewhere.
    if (form.country === 'AU' && !form.state.trim()) return 'State is required';
    const pc = validatePostcode(form.postcode, form.country);
    if (!pc.valid) return pc.message ?? 'Invalid postcode';
    return null;
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    const body = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      address1: form.address1.trim(),
      ...(form.address2.trim() && { address2: form.address2.trim() }),
      city: form.city.trim(),
      ...(form.state.trim() && { state: form.state.trim() }),
      ...(form.postcode.trim() && { postcode: form.postcode.trim() }),
      country: form.country,
      isDefault: form.isDefault,
    };

    try {
      if (editingId) {
        await apiClient.patch(`/users/me/addresses/${editingId}`, body);
      } else {
        await apiClient.post('/users/me/addresses', body);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(blankForm);
      await loadAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(addressId: string) {
    setError(null);
    try {
      await apiClient.patch(`/users/me/addresses/${addressId}/default`);
      await loadAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update default address');
    }
  }

  async function deleteAddress(addressId: string) {
    setError(null);
    try {
      await apiClient.delete(`/users/me/addresses/${addressId}`);
      if (editingId === addressId) {
        setShowForm(false);
        setEditingId(null);
      }
      await loadAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address');
    }
  }

  function inputClass() {
    return 'mt-1 block w-full rounded-lg border border-border bg-surface-raised px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
  }

  return (
    <div>
      <PageHeader
        title="Saved Addresses"
        description="Saved addresses can be used in checkout. Your address data is secured and only available inside your account."
        actions={
          <Button onClick={startCreate} icon={<Plus className="h-4 w-4" />}>
            Create a new address
          </Button>
        }
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-primary-muted p-2 text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text">Faster checkout</h2>
              <p className="mt-1 text-sm text-text-muted">
                Choose a saved address at checkout and the shipping form will be filled automatically.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-success-muted p-2 text-success">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text">Secured data</h2>
              <p className="mt-1 text-sm text-text-muted">
                Saved addresses are protected by your account and are not used for payment storage.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-error/30 bg-error-muted p-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {showForm && (
        <Card className="mt-6">
          <CardContent>
            <form onSubmit={saveAddress}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-text">
                    {editingAddress ? 'Edit address' : 'Create a new address'}
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    This address can be selected during store checkout.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-text-muted">
                      First Name *
                    </label>
                    <input id="firstName" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} className={inputClass()} />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-text-muted">
                      Last Name *
                    </label>
                    <input id="lastName" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} className={inputClass()} />
                  </div>
                </div>

                <div>
                  <label htmlFor="address1" className="block text-sm font-medium text-text-muted">
                    Address Line 1 *
                  </label>
                  <input id="address1" value={form.address1} onChange={(e) => updateField('address1', e.target.value)} className={inputClass()} />
                </div>

                <div>
                  <label htmlFor="address2" className="block text-sm font-medium text-text-muted">
                    Address Line 2 <span className="text-text-dim">(optional)</span>
                  </label>
                  <input id="address2" value={form.address2} onChange={(e) => updateField('address2', e.target.value)} className={inputClass()} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-text-muted">
                      City *
                    </label>
                    <input id="city" value={form.city} onChange={(e) => updateField('city', e.target.value)} className={inputClass()} />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-text-muted">
                      {form.country === 'AU' ? 'State *' : 'State / Province'}
                    </label>
                    {form.country === 'AU' ? (
                      <select id="state" value={form.state} onChange={(e) => updateField('state', e.target.value)} className={inputClass()}>
                        <option value="">Select state...</option>
                        {AU_STATES.map((state) => (
                          <option key={state.value} value={state.value}>{state.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input id="state" value={form.state} onChange={(e) => updateField('state', e.target.value)} className={inputClass()} placeholder="State / Province / Region" />
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {countryUsesPostcode(form.country) && (
                    <div>
                      <label htmlFor="postcode" className="block text-sm font-medium text-text-muted">
                        {form.country === 'AU' ? 'Postcode *' : 'Postal / ZIP code *'}
                      </label>
                      <input id="postcode" value={form.postcode} onChange={(e) => updateField('postcode', e.target.value)} className={inputClass()} maxLength={form.country === 'AU' ? 4 : 12} />
                    </div>
                  )}
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-text-muted">
                      Country *
                    </label>
                    <select
                      id="country"
                      value={form.country}
                      onChange={(e) => {
                        const country = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          country,
                          state: '',
                          postcode: countryUsesPostcode(country) ? prev.postcode : '',
                        }));
                      }}
                      className={inputClass()}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 text-sm text-text-muted">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => updateField('isDefault', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
                  />
                  Use as my default checkout address
                </label>

                <Button type="submit" loading={saving}>
                  {editingAddress ? 'Save changes' : 'Save address'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        {loading ? (
          <Card>
            <CardContent>
              <p className="text-sm text-text-muted">Loading saved addresses...</p>
            </CardContent>
          </Card>
        ) : addresses.length === 0 ? (
          <Card>
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title="No addresses saved"
              description="Create a new address to speed up your next store checkout."
              action={<Button onClick={startCreate}>Create a new address</Button>}
            />
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {addresses.map((address, index) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
              >
                <Card>
                  <CardContent>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-text">
                            {address.firstName} {address.lastName}
                          </h2>
                          {address.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary-muted px-2 py-0.5 text-xs font-medium text-primary">
                              <Check className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-text-muted">{address.address1}</p>
                        {address.address2 && <p className="text-sm text-text-muted">{address.address2}</p>}
                        <p className="text-sm text-text-muted">
                          {address.city}, {address.state} {address.postcode}
                        </p>
                        <p className="text-sm text-text-muted">{COUNTRIES.find((c) => c.code === address.country)?.name ?? address.country}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {!address.isDefault && (
                        <Button variant="secondary" size="sm" onClick={() => makeDefault(address.id)}>
                          Make Default
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" icon={<Pencil className="h-4 w-4" />} onClick={() => startEdit(address)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => deleteAddress(address.id)}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
