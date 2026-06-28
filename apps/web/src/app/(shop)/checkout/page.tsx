'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/providers/cart-provider';
import { useAuth } from '@/providers/auth-provider';
import { apiClient } from '@/lib/api-client';
import {
  MapPin, Package, RefreshCw, ShieldCheck, Lock, ArrowLeft, CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { COUNTRIES } from '@/lib/countries';
import {
  calculateShippingInCents,
  SHIPPING_AUSTRALIA_IN_CENTS,
} from '@scan2call/shared';

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

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

interface CheckoutSessionResponse {
  data: { sessionUrl: string };
}

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

interface ShippingForm {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  customerNotes: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  address1?: string;
  city?: string;
  state?: string;
  postcode?: string;
}

function inputClass(hasError: boolean): string {
  return `mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 bg-surface-raised text-text placeholder:text-text-dim ${
    hasError
      ? 'border-error focus:border-error focus:ring-error'
      : 'border-border focus:border-primary focus:ring-primary'
  }`;
}

export default function CheckoutPage() {
  const { items, getTotal, getLineTotal, itemCount } = useCart();
  const { user } = useAuth();

  const [form, setForm] = useState<ShippingForm>({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'AU',
    customerNotes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiClient.get<{ data: SavedAddress[] }>('/users/me/addresses');
        if (cancelled) return;
        setSavedAddresses(res.data);
        const def = res.data.find((a) => a.isDefault) ?? res.data[0];
        if (def) {
          setSelectedAddressId(def.id);
          applyAddress(def);
        }
      } catch { /* no saved addresses */ }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function applyAddress(address: SavedAddress) {
    setForm((prev) => ({
      ...prev,
      firstName: address.firstName,
      lastName: address.lastName,
      address1: address.address1,
      address2: address.address2 ?? '',
      city: address.city,
      state: address.state,
      postcode: address.postcode,
      country: address.country,
    }));
    setErrors({});
  }

  function updateField(field: keyof ShippingForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSelectedAddressId('');
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const e: FormErrors = {};
    const isAU = form.country === 'AU';
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.address1.trim()) e.address1 = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.state.trim()) e.state = 'Required';
    if (!form.postcode.trim()) {
      e.postcode = 'Required';
    } else if (isAU && !/^\d{4}$/.test(form.postcode.trim())) {
      e.postcode = 'Must be a 4-digit postcode';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function formMatchesSaved(): boolean {
    return savedAddresses.some(
      (a) =>
        a.firstName.trim().toLowerCase() === form.firstName.trim().toLowerCase() &&
        a.lastName.trim().toLowerCase() === form.lastName.trim().toLowerCase() &&
        a.address1.trim().toLowerCase() === form.address1.trim().toLowerCase() &&
        (a.address2 ?? '').trim().toLowerCase() === form.address2.trim().toLowerCase() &&
        a.city.trim().toLowerCase() === form.city.trim().toLowerCase() &&
        a.state === form.state &&
        a.postcode.trim() === form.postcode.trim() &&
        a.country === form.country,
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (saveAddress && !formMatchesSaved()) {
        await apiClient.post('/users/me/addresses', {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          address1: form.address1.trim(),
          ...(form.address2.trim() && { address2: form.address2.trim() }),
          city: form.city.trim(),
          state: form.state,
          postcode: form.postcode.trim(),
          country: form.country,
          isDefault: savedAddresses.length === 0,
        });
      }

      const body = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          durationYears: item.durationYears,
          autoRenew: item.autoRenew,
          ...(item.tagLabel?.trim() && { tagLabel: item.tagLabel.trim() }),
          ...(item.tagDescription?.trim() && { tagDescription: item.tagDescription.trim() }),
        })),
        shippingFirstName: form.firstName.trim(),
        shippingLastName: form.lastName.trim(),
        shippingAddress1: form.address1.trim(),
        ...(form.address2.trim() && { shippingAddress2: form.address2.trim() }),
        shippingCity: form.city.trim(),
        shippingState: form.state,
        shippingPostcode: form.postcode.trim(),
        shippingCountry: form.country,
        ...(form.customerNotes.trim() && { customerNotes: form.customerNotes.trim() }),
      };

      const result = await apiClient.post<CheckoutSessionResponse>('/checkout/session', body);
      window.location.href = result.data.sessionUrl;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create checkout session');
      setIsSubmitting(false);
    }
  }

  const isAU = form.country === 'AU';
  const subtotal = getTotal();
  const shippingInCents = calculateShippingInCents(form.country);
  const total = subtotal + shippingInCents;

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Checkout" />
        <Card className="mt-8">
          <EmptyState
            title="Your cart is empty"
            description="Add some items to your cart before checking out."
            action={
              <Link href="/store">
                <Button variant="outline">Browse the Store</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Checkout"
        description="Review your order and enter your shipping details."
      />

      {/* Progress breadcrumb */}
      <div className="mt-4 flex items-center gap-2 text-sm text-text-dim">
        <Link href="/cart" className="flex items-center gap-1 hover:text-text transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Cart
        </Link>
        <span>/</span>
        <span className="text-primary font-medium">Checkout</span>
        <span>/</span>
        <span>Payment</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-8 lg:grid-cols-5">
        {/* ── Left: Shipping Details ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 lg:col-span-3"
        >
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text">Shipping Address</h2>
              </div>

              {/* Saved address picker */}
              {savedAddresses.length > 0 && (
                <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <label htmlFor="savedAddress" className="block text-sm font-medium text-text-muted mb-2">
                    Use a saved address
                  </label>
                  <select
                    id="savedAddress"
                    value={selectedAddressId}
                    onChange={(e) => {
                      setSelectedAddressId(e.target.value);
                      const found = savedAddresses.find((a) => a.id === e.target.value);
                      if (found) applyAddress(found);
                    }}
                    className="block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Enter a new address</option>
                    {savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.isDefault ? 'Default - ' : ''}{a.firstName} {a.lastName}, {a.address1}, {a.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-text-muted">
                      First Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={form.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      className={inputClass(!!errors.firstName)}
                      placeholder="Jane"
                    />
                    {errors.firstName && <p className="mt-1 text-xs text-error">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-text-muted">
                      Last Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={form.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      className={inputClass(!!errors.lastName)}
                      placeholder="Smith"
                    />
                    {errors.lastName && <p className="mt-1 text-xs text-error">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="address1" className="block text-sm font-medium text-text-muted">
                    Street Address <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="address1"
                    value={form.address1}
                    onChange={(e) => updateField('address1', e.target.value)}
                    className={inputClass(!!errors.address1)}
                    placeholder="123 Main Street"
                  />
                  {errors.address1 && <p className="mt-1 text-xs text-error">{errors.address1}</p>}
                </div>

                <div>
                  <label htmlFor="address2" className="block text-sm font-medium text-text-muted">
                    Apartment, suite, unit <span className="text-text-dim font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="address2"
                    value={form.address2}
                    onChange={(e) => updateField('address2', e.target.value)}
                    className={inputClass(false)}
                    placeholder="Unit 4B"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <label htmlFor="city" className="block text-sm font-medium text-text-muted">
                      City / Suburb <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      className={inputClass(!!errors.city)}
                      placeholder="Sydney"
                    />
                    {errors.city && <p className="mt-1 text-xs text-error">{errors.city}</p>}
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-text-muted">
                      {isAU ? 'State' : 'State / Province'} <span className="text-error">*</span>
                    </label>
                    {isAU ? (
                      <select
                        id="state"
                        value={form.state}
                        onChange={(e) => updateField('state', e.target.value)}
                        className={inputClass(!!errors.state)}
                      >
                        <option value="">Select...</option>
                        {AU_STATES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        id="state"
                        value={form.state}
                        onChange={(e) => updateField('state', e.target.value)}
                        className={inputClass(!!errors.state)}
                        placeholder="State / Province / Region"
                      />
                    )}
                    {errors.state && <p className="mt-1 text-xs text-error">{errors.state}</p>}
                  </div>
                  <div>
                    <label htmlFor="postcode" className="block text-sm font-medium text-text-muted">
                      {isAU ? 'Postcode' : 'Postal / ZIP code'} <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      id="postcode"
                      value={form.postcode}
                      onChange={(e) => updateField('postcode', e.target.value)}
                      className={inputClass(!!errors.postcode)}
                      placeholder={isAU ? '2000' : 'Postal / ZIP'}
                      maxLength={isAU ? 4 : 12}
                    />
                    {errors.postcode && <p className="mt-1 text-xs text-error">{errors.postcode}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-text-muted">
                    Country <span className="text-error">*</span>
                  </label>
                  <select
                    id="country"
                    value={form.country}
                    onChange={(e) => {
                      const country = e.target.value;
                      // Reset state when switching between AU (dropdown) and intl (text).
                      setForm((prev) => ({ ...prev, country, state: '' }));
                      setSelectedAddressId('');
                      setErrors((prev) => ({ ...prev, state: undefined, postcode: undefined }));
                    }}
                    className={inputClass(false)}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-text-dim">
                    {isAU
                      ? 'Flat shipping within Australia: $5.00 AUD.'
                      : 'Worldwide shipping: $10.00 AUD flat.'}
                  </p>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface-raised p-3 text-sm text-text-muted hover:border-primary/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
                  />
                  Save this address for future orders
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <h2 className="text-lg font-semibold text-text mb-4">Order Notes</h2>
              <label htmlFor="customerNotes" className="block text-sm font-medium text-text-muted">
                Special instructions <span className="text-text-dim font-normal">(optional)</span>
              </label>
              <textarea
                id="customerNotes"
                value={form.customerNotes}
                onChange={(e) => updateField('customerNotes', e.target.value)}
                rows={3}
                className={`${inputClass(false)} resize-none`}
                placeholder="Any special instructions for your order..."
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Right: Order Summary ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-2"
        >
          <div className="sticky top-8 space-y-4">
            <Card>
              <CardContent className="py-6">
                <h2 className="font-semibold text-text mb-4">Order Summary</h2>

                <div className="divide-y divide-border">
                  {items.map((item) => (
                    <div key={item.productId} className="py-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-raised border border-border">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-text-dim">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text">{item.name}</p>
                          <p className="text-xs text-text-muted mt-0.5">
                            Qty: {item.quantity}
                            {item.hasFindMy && <span className="ml-1 text-text-dim">&middot; device + QR</span>}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised border border-border px-2 py-0.5 text-[10px] text-text-dim">
                              <RefreshCw className="h-2.5 w-2.5" />
                              {item.durationYears} {item.durationYears === 1 ? 'yr' : 'yrs'}
                            </span>
                            {item.autoRenew && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] text-primary">
                                <RefreshCw className="h-2.5 w-2.5" />
                                Auto-renew
                              </span>
                            )}
                            {item.tagLabel && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised border border-border px-2 py-0.5 text-[10px] text-text-dim truncate max-w-[120px]">
                                {item.tagLabel}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-text">
                          ${formatPrice(getLineTotal(item))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-y-1.5 border-t border-border pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span className="font-medium text-text">${formatPrice(subtotal)} AUD</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">
                      Shipping {shippingInCents === SHIPPING_AUSTRALIA_IN_CENTS ? '(Australia)' : '(Worldwide)'}
                    </span>
                    <span className="font-medium text-text">${formatPrice(shippingInCents)} AUD</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-bold text-text">Total</span>
                  <span className="text-2xl font-bold text-primary">${formatPrice(total)}<span className="text-sm font-normal text-text-dim ml-1">AUD</span></span>
                </div>

                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3"
                  >
                    <p className="text-sm text-error">{submitError}</p>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="mt-5 w-full"
                  size="lg"
                  icon={<CreditCard className="h-4 w-4" />}
                >
                  {isSubmitting ? 'Redirecting to payment...' : 'Continue to Payment'}
                </Button>
              </CardContent>
            </Card>

            {/* Trust signals */}
            <div className="rounded-xl border border-border bg-surface/60 p-4 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-text-dim">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                Secure checkout powered by Stripe
              </div>
              <div className="flex items-center gap-2.5 text-xs text-text-dim">
                <Lock className="h-4 w-4 text-primary shrink-0" />
                Your payment details are never stored on our servers
              </div>
            </div>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
