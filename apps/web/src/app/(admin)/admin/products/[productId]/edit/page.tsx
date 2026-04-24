'use client';

import { useParams } from 'next/navigation';
import ProductForm from '../../_components/product-form';

export default function EditProductPage() {
  const params = useParams<{ productId: string }>();
  return <ProductForm productId={params.productId} />;
}
