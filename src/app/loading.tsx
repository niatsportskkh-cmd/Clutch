export default function Loading() {
  return (
    <div aria-busy className="flex animate-pulse flex-col gap-6 pt-6">
      <div className="h-16 w-2/3 max-w-xl rounded-2xl bg-white/[0.06]" />
      <div className="h-5 w-1/2 max-w-md rounded-full bg-white/[0.05]" />
      <div className="mt-8 h-36 max-w-3xl rounded-[1.75rem] bg-white/[0.04]" />
      <div className="h-36 max-w-3xl rounded-[1.75rem] bg-white/[0.04]" />
    </div>
  )
}
