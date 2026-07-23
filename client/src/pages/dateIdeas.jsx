import DateIdeaBoard from '../components/dateIdeaBoard'
import DashboardOrbs from '../components/DashboardOrbs'
import './Dashboard.css'

export default function DateIdeas() {
  return (
    <div className="dashboard-page">
      <DashboardOrbs />

      <section className="dashboard-page__content dashboard-page__content--wide">
        <h1 className="dashboard-page__title">Date ideas</h1>
        <p className="dashboard-page__text">
          Collect ideas for your next visit, vote on your favorites, and check them off together.
        </p>

        <DateIdeaBoard />
      </section>
    </div>
  )
}
