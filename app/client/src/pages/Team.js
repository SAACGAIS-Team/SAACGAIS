const teamMembers = [
  {
    name: "Member One",
    image: "/images/member1.jpg", // put files in public/images/ or swap for an import
    pursuit:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    contribution:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.",
    bio:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.",
  },
  {
    name: "Member Two",
    image: "/images/member2.jpg",
    pursuit:
      "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    contribution:
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.",
    bio:
      "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores.",
  },
  {
    name: "Member Three",
    image: "/images/member3.jpg",
    pursuit:
      "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam.",
    contribution:
      "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque.",
    bio:
      "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates.",
  },
  {
    name: "Member Four",
    image: "/images/member4.jpg",
    pursuit:
      "Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio.",
    contribution:
      "Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur.",
    bio:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non sapien at nulla hendrerit efficitur.",
  },
];

function Team() {
  return (
    <div className="team-page">
      <header className="team-header">
        <h1>Meet the Team</h1>
        <p>
          Our capstone project focuses on securing agent-to-agent communication
          in generative AI systems. Below are the members who designed, built,
          and deployed this platform.
        </p>
      </header>

      <section className="team-grid">
        {teamMembers.map((member) => (
          <article key={member.name} className="team-card">
            <div className="team-photo">
              {member.image ? (
                <img src={member.image} alt={member.name} />
              ) : (
                <div className="team-photo-placeholder">Photo</div>
              )}
            </div>

            <h2 className="team-name">{member.name}</h2>

            <div className="team-section">
              <h3>Current Pursuit</h3>
              <p>{member.pursuit}</p>
            </div>

            <div className="team-section">
              <h3>Role in the Project</h3>
              <p>{member.contribution}</p>
            </div>

            <div className="team-section">
              <h3>About</h3>
              <p>{member.bio}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Team;