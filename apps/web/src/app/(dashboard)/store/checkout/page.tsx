'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/providers/cart-provider';
import { useAuth } from '@/providers/auth-provider';
import { apiClient } from '@/lib/api-client';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

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
  data: {
    sessionUrl: string;
  };
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

export default function CheckoutPage() {
  const { items, getTotal, itemCount } = useCart();
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
  const [tagCustomizations, setTagCustomizations] = useState<
    Record<string, { tagLabel: string; tagDescription: string }>
  >({});

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || '',
      }));
    }
  }, [user]);

  const total = getTotal();

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

  function updateField(field: keyof ShippingForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!form.address1.trim()) {
      newErrors.address1 = 'Address is required';
    }
    if (!form.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!form.state) {
      newErrors.state = 'State is required';
    }
    if (!form.postcode.trim()) {
      newErrors.postcode = 'Postcode is required';
    } else if (!/^\d{4}$/.test(form.postcode.trim())) {
      newErrors.postcode = 'Must be a 4-digit Australian postcode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const body = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          tagLabel:
            tagCustomizations[item.productId]?.tagLabel || undefined,
          tagDescription:
            tagCustomizations[item.productId]?.tagDescription ||
            undefined,
        })),
        shippingFirstName: form.firstName.trim(),
        shippingLastName: form.lastName.trim(),
        shippingAddress1: form.address1.trim(),
        ...(form.address2.trim() && {
          shippingAddress2: form.address2.trim(),
        }),
        shippingCity: form.city.trim(),
        shippingState: form.state,
        shippingPostcode: form.postcode.trim(),
        shippingCountry: form.country,
        ...(form.customerNotes.trim() && {
          customerNotes: form.customerNotes.trim(),
        }),
      };

      const result =
        await apiClient.post<CheckoutSessionResponse>(
          '/checkout/session',
          body,
        );

      window.location.href = result.data.sessionUrl;
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create checkout session',
      );
      setIsSubmitting(false);
    }
  }

  function inputClass(hasError: boolean): string {
    return `mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 bg-surface-raised text-text placeholder:text-text-dim ${
      hasError
        ? 'border-error focus:border-error focus:ring-error'
        : 'border-border focus:border-primary focus:ring-primary'
    }`;
  }

  return (
    <div>
      <PageHeader
        title="Checkout"
        description="Complete your purchase with secure payment via Stripe."
      />

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="space-y-6 lg:col-span-2"
        >
          <Card>
            <CardContent className="py-6">
              <h2 className="text-lg font-semibold text-text">Shipping Address</h2>

              <div className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-text-muted"
                    >
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={form.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      className={inputClass(!!errors.firstName)}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-error">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-text-muted"
                    >
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={form.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      className={inputClass(!!errors.lastName)}
                      placeholder="Smith"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-error">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="address1"
                    className="block text-sm font-medium text-text-muted"
                  >
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    id="address1"
                    value={form.address1}
                    onChange={(e) => updateField('address1', e.target.value)}
                    className={inputClass(!!errors.address1)}
                    placeholder="123 Main Street"
                  />
                  {errors.address1 && (
                    <p className="mt-1 text-xs text-error">
                      {errors.address1}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="address2"
                    className="block text-sm font-medium text-text-muted"
                  >
                    Address Line 2{' '}
                    <span className="text-text-dim">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="address2"
                    value={form.address2}
                    onChange={(e) => updateField('address2', e.target.value)}
                    className={inputClass(false)}
                    placeholder="Apt 4B"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-text-muted"
                    >
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      className={inputClass(!!errors.city)}
                      placeholder="Sydney"
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-error">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-text-muted"
                    >
                      State *
                    </label>
                    <select
                      id="state"
                      value={form.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      className={inputClass(!!errors.state)}
                    >
                      <option value="">Select state...</option>
                      {AU_STATES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="mt-1 text-xs text-error">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="postcode"
                      className="block text-sm font-medium text-text-muted"
                    >
                      Postcode *
                    </label>
                    <input
                      type="text"
                      id="postcode"
                      value={form.postcode}
                      onChange={(e) => updateField('postcode', e.target.value)}
                      className={inputClass(!!errors.postcode)}
                      placeholder="2000"
                      maxLength={4}
                    />
                    {errors.postcode && (
                      <p className="mt-1 text-xs text-error">
                        {errors.postcode}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-text-muted"
                    >
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      value="Australia"
                      disabled
                      className="mt-1 block w-full rounded-lg border border-border bg-surface-raised px-4 py-2.5 text-sm text-text-dim"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="customerNotes"
                    className="block text-sm font-medium text-text-muted"
                  >
                    Order Notes{' '}
                    <span className="text-text-dim">(optional)</span>
                  </label>
                  <textarea
                    id="customerNotes"
                    value={form.customerNotes}
                    onChange={(e) =>
                      updateField('customerNotes', e.target.value)
                    }
                    rows={3}
                    className={inputClass(false)}
                    placeholder="Any special instructions for your order..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="lg:col-span-1"
        >
          <div className="sticky top-8">
            <Card>
              <CardContent className="py-6">
                <h2 className="text-lg font-semibold text-text">Order Summary</h2>

                <div className="mt-4 divide-y divide-border">
                  {items.map((item) => (
                    <div key={item.productId} className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-raised">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-text-dim">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text">{item.name}</p>
                            <p className="text-xs text-text-muted">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-medium text-text">
                          ${formatPrice(item.priceInCents * item.quantity)}
                        </span>
                      </div>

                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-text-muted">
                          Tag customization (optional)
                        </p>
                        <input
                          type="text"
                          placeholder="Tag label (e.g., My Dog Max)"
                          value={
                            tagCustomizations[item.productId]?.tagLabel || ''
                          }
                          onChange={(e) =>
                            setTagCustomizations((prev) => ({
                              ...prev,
                              [item.productId]: {
                                ...prev[item.productId],
                                tagLabel: e.target.value,
                                tagDescription:
                                  prev[item.productId]?.tagDescription || '',
                              },
                            }))
                          }
                          className="w-full rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          maxLength={200}
                        />
                        <textarea
                          placeholder="Tag description"
                          value={
                            tagCustomizations[item.productId]
                              ?.tagDescription || ''
                          }
                          onChange={(e) =>
                            setTagCustomizations((prev) => ({
                              ...prev,
                              [item.productId]: {
                                tagLabel:
                                  prev[item.productId]?.tagLabel || '',
                                tagDescription: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          rows={2}
                          maxLength={1000}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">
                      Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                    </span>
                    <span className="font-medium text-text">
                      ${formatPrice(total)} AUD
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="font-semibold text-text">Total</span>
                  <span className="text-xl font-bold text-text">
                    ${formatPrice(total)} AUD
                  </span>
                </div>

                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 rounded-lg border border-error/30 bg-error-muted p-3"
                  >
                    <p className="text-sm text-error">{submitError}</p>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="mt-6 w-full"
                  size="lg"
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </Button>

                <p className="mt-3 text-center text-xs text-text-dim">
                  You will be redirected to Stripe for secure payment.
                </p>

                <Link
                  href="/store/cart"
                  className="mt-3 block text-center text-sm text-text-muted hover:text-text transition-colors"
                >
                  &larr; Back to Cart
                </Link>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
