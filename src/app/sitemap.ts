import type { MetadataRoute } from "next";
import { PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "http://localhost:3000"
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const publishedPosts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      slug: true,
      updatedAt: true,
      publishedAt: true,
    },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const postRoutes: MetadataRoute.Sitemap = publishedPosts.map((post) => ({
    url: `${baseUrl}/posts/${post.slug}`,
    lastModified: post.updatedAt ?? post.publishedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...postRoutes];
}