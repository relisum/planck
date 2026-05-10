export const TaskCardSkeleton = () => {
  return (
    <div className="card">
      <div className="skeleton card-title" style={{ width: "30%" }} />
      <div className="card-description">
        <p className="skeleton" style={{ width: "100%" }} />
        <p className="skeleton" style={{ width: "70%" }} />
      </div>
      <div className="skeleton card-date" style={{ width: "25%" }} />
    </div>
  )
}