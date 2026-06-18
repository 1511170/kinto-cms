/**
 * Trigger a site rebuild via deploy hook or GitHub Actions repository_dispatch.
 * Best-effort: callers decide whether failures should affect their own flow.
 */
export async function triggerDeployHook(
  hookUrl: string,
  githubToken?: string,
): Promise<boolean> {
  try {
    const isGitHub = hookUrl.includes("api.github.com");
    const res = await fetch(hookUrl, {
      method: "POST",
      headers: isGitHub
        ? {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "kinto-shopify-webhook/1.0",
          }
        : {},
      body: isGitHub
        ? JSON.stringify({ event_type: "shopify-webhook" })
        : undefined,
    });

    if (!res.ok) {
      console.error(`Deploy hook failed: ${res.status} ${res.statusText}`);
      return false;
    }

    console.log(
      JSON.stringify({
        event: "shopify_webhook_deploy_hook_ok",
        target: isGitHub ? "github_repository_dispatch" : "deploy_hook",
        status: res.status,
      }),
    );
    return true;
  } catch (err: any) {
    console.error(`Deploy hook error: ${err?.message ?? String(err)}`);
    return false;
  }
}
