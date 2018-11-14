/*

Counts additions/deletions in phabricator diffs and displays them in diff summary
Make sure you've updated maniftest.json with your phabricator URL

*/

const increased = "color: #28a745;"
const decreased = "color: #cb2431;"

const sectionHeader = `
<div class="phui-property-list-section-header">
    <span class="phui-property-list-section-header-icon">
        <span class="visual-only phui-icon-view phui-font-fa fa-bar-chart-o bluegrey" data-meta="0_7" aria-hidden="true"></span>
        Dead Code Society 🔪
    </span>
</div>
`

const sectionBody = `
<div class="phui-property-list-text-content">
    <div class="phabricator-remarkup">
        <p style="font-weight: bold;">
          <span id="deltaContainer" style="${increased}">Δ <span id="delta">0</span></span>
        </p>
        <p style="font-weight: bold;">
          <span style="${increased}">+ <span id="added">0</span></span>
          <span style="${decreased}">- <span id="deleted">0</span></span>
        </p>
    </div>
</div>
`

const e = document.getElementsByClassName('phui-property-list-section')[0];
e.insertAdjacentHTML( 'beforeend', sectionHeader );
e.insertAdjacentHTML( 'beforeend', sectionBody );

// Used to extract line modified counts from the ToC
const LINES_REGEX = /\((\d*)/

// Status can be Added, Deleted, Modified
const statuses = Array.from(document.querySelectorAll('td.differential-toc-char')).map(item => item.textContent);
// Lines changes as reported by phabricator (used for file additions and deletions)
const linesChanged = Array.from(document.querySelectorAll('td.differential-toc-file')).map((item) => {
  const match = item.textContent.match(LINES_REGEX);
  return match ? parseInt(match[1]) : 0;
})
// convert #change-xz9IumBgJjfM to xz9IumBgJjfM
const ids = Array.from(document.querySelectorAll('td.differential-toc-file'))
  .map(item => item.querySelector('a') .getAttribute("href") .substring(8));

const updateStats = (additions, deletions) => {
  const oldDelta = parseInt(document.getElementById('delta').textContent);
  const oldAdditions = parseInt(document.getElementById('added').textContent);
  const oldDeletions = parseInt(document.getElementById('deleted').textContent);
  const newDelta = oldDelta + additions - deletions;
  const newAdditions = oldAdditions + additions;
  const newDeletions = oldDeletions + deletions;
  
  document.getElementById('delta').textContent = newDelta;
  document.getElementById('added').textContent = newAdditions;
  document.getElementById('deleted').textContent = newDeletions;
  document.getElementById('deltaContainer').style = newDelta >= 0 ? increased : decreased;
};

// Once diff loads
const handleMutation = (mutationsList, observer) => {
  for(let mutation of mutationsList) {
    if(mutation.addedNodes.length) {
      for(let node of mutation.addedNodes) {
        additions = Array.from(node.querySelectorAll('td.new'))
          .filter(line => line.className === 'new' || line.className === 'new new-full' || line.className === 'right new').length;
        deletions = node.querySelectorAll('td.old').length;
        updateStats(additions, deletions);
      };
    }
  };
};

// If the change was a file addition or deletion we can just use the counts we parsed from phabricator text.
// Otherwise, set up observer
ids.forEach((id, index) => {
  if (statuses[index] === 'A') {
    updateStats(linesChanged[index], 0);
  } else if (statuses[index] === 'D') {
    updateStats(0, linesChanged[index]);
  } else {
    const change = document.querySelector(`#diff-change-${id}`);
    const config = { childList: true, subtree: true }
    const observer = new MutationObserver(handleMutation);
    observer.observe(change, config);
  }
});