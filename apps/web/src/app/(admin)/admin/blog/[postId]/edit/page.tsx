import BlogPostForm from '../../_components/blog-post-form';

export default function EditBlogPostPage({ params }: { params: { postId: string } }) {
  return <BlogPostForm postId={params.postId} />;
}
