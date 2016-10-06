import React from 'react';
import FalcorController from 'lib/falcor/FalcorController';
import _ from 'lodash';
import { formatDate } from 'lib/utilities';

export default class EditorMainIssueController extends FalcorController {
  constructor(props) {
    super(props);
    this.publishIssue = this.publishIssue.bind(this);
    this.unpublishIssue = this.unpublishIssue.bind(this);
    this.safeSetState({
      changed: false,
      saving: false,
    });
  }
  static getFalcorPathSets(params) {
    return ['issuesByNumber', params.issueNumber, ['name', 'issueNumber', 'published_at']];
  }

  publishIssue() {
    const callback = () => {
      this.safeSetState({changed: false});
      setTimeout(() => {
        this.safeSetState({saving: false});
      }, 1000);
    }
    const falcorPathSets = [
      ['issuesByNumber', this.props.params.issueNumber, 'categories', {length: 20}, 'articles', {length: 50}, ['title', 'teaser', 'category']],
      ['issuesByNumber', this.props.params.issueNumber, 'categories', {length: 20}, 'articles', {length: 50}, 'authors', 0],
      ['issuesByNumber', this.props.params.issueNumber, ['id', 'published_at', 'name']],
    ];
    this.props.model.get(...falcorPathSets).then((x) => {
      if (!x) {
        window.alert("There was an error getting the issue data from the database " +
          "please contact the developers");
      }
      else {
        // Check validity of the issue before publishing it
        const issueNumber = this.props.params.issueNumber;
        const issue = x.json.issuesByNumber[issueNumber];
        const fields = falcorPathSets[0][falcorPathSets[0].length-1].filter((field) => {
          return field !== 'title';
        });
        if (issue.published_at) {
          if (!window.confirm("This article is already published, do you want to republish it?")) {
            return;
          }
        }
        const valid = _.every(issue.categories, (category) => {
          return _.every(category.articles, (article) => {
            const valid = fields.every((field) => {
              if (!article[field]) {
                window.alert(article.title + " has no " + field + ". Please correct this");
                return false;
              }
              return true;
            });
            if (!valid) {
              return false;
            }
            if (!article.authors || !article.authors[0]) {
              window.alert(article.title + " has no authors. Please correct this");
              return false;
            }
            return true;
          });
        });
        if (!valid) {
          return;
        }
        // The issue is valid, we can publish it
        this.safeSetState({
          changed: true,
          saving: true,
        });
        this.falcorCall(['issuesByNumber', issueNumber, 'publishIssue'],
          [issue.id], undefined, undefined, undefined, callback);
      }
    })
    .catch((e) => {
      console.error(e); // eslint-disable-line no-console
      window.alert("There was an error getting the issue data from the database " +
        "please contact the developers. The error message is in the developers console");
    })
  }

  unpublishIssue() {
    const callback = () => {
      this.safeSetState({publishing: false});
      // window.alert("Issue succesfully unpublished");
    }
    this.safeSetState({publishing: true});
    this.falcorUpdate({
      paths: [['issuesByNumber', this.props.params.issueNumber, 'published_at']],
      jsonGraph: {
        issuesByNumber: {
          [this.props.params.issueNumber]: {
            published_at: null,
          },
        },
      },
    }, undefined, callback);
  }

  render() {
    if (this.state.ready) {
      if (!this.state.data) {
        return <p>This issue does not exist</p>;
      }
      const issue = this.state.data.issuesByNumber[this.props.params.issueNumber];

      let changedStateMessage;
      const changedStateStyle = {};
      if (!this.state.changed) {
        if (!this.state.saving) {
          changedStateMessage = "No Changes";
        }
        else {
          changedStateMessage = "Saved";
          changedStateStyle.color = "green";
        }
      }
      else {
        if (!this.state.saving) {
          changedStateMessage = "Unsaved Changes";
          changedStateStyle.color = "red";
        }
        else {
          changedStateMessage = "Saving"
          changedStateStyle.color = "#65e765";
        }
      }
      return (
        <div>
          <h2 style={changedStateStyle}>{changedStateMessage}</h2>
          <h3>{issue.name}</h3>
          {
            issue.published_at
            ? <h4>Already Published</h4>
            : <h4>Not Published</h4>
          }
          <div>
            <button
              type="button"
              className="pure-button"
              onClick={this.publishIssue}
              style={{
                width: "15em",
                height: "10em",
                backgroundColor: "green",
              }}
            >Publish Issue</button>
            <button
              type="button"
              className="pure-button"
              onClick={this.unpublishIssue}
              style={{
                width: "15em",
                height: "10em",
                backgroundColor: "red",
              }}
            >Unpublish Issue</button>
          </div>
          <h4>Change Issue Data</h4>
          <form
            className="pure-form pure-form-stacked"
            onSubmit={this.saveChanges}
            onChange={this.handleChanges}
          >
            Name:
            <input
              type="text"
              name="name"
              defaultValue={issue.name}
              placeholder="Input Name"
              disabled={this.saving}
            />
            Issue Number:
            <input
              type="text"
              name="name"
              defaultValue={issue.issueNumber}
              placeholder="Input Issue Number"
              disabled={this.saving}
            />
            Publish Date: <br />
            Please input in format: yyyy-mm-dd
            {
              issue.published_at ?
              <input
                type="text"
                name="name"
                defaultValue={formatDate(new Date(issue.published_at))}
                placeholder="Input date"
                disabled={this.saving || !issue.published_at}
              />
              :
              <input
                type="text"
                value="Issue is unpublished"
                disabled
              />
            }
            <input
              type="submit"
              className="pure-button pure-button-primary"
              style={{marginTop: "5px"}}
              value="Save Changes"
            />
          </form>
        </div>
      );
    }
    else {
      return <div>loading...</div>
    }
  }
}
