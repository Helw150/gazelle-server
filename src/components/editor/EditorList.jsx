import BaseComponent from 'lib/BaseComponent';
import React from 'react';
import _ from 'lodash';

import List from 'material-ui/List/List';


export default class EditorArticleList extends BaseComponent {
  render() {
    if (this.props.elements) {
      const elements = this.props.elements;
      return (
        <List style={{overflow: "auto", maxHeight: "100vh"}}>
          {
            _.map(elements, this.props.createElement)
          }
        </List>
      )
    }
    else {
      return <div>This page does not exist</div>;
    }
  }
}

EditorArticleList.propTypes = {
  elements: React.PropTypes.oneOfType([
    React.PropTypes.array,
    React.PropTypes.object,
  ]).isRequired,
  createElement: React.PropTypes.func.isRequired,
}
