// @flow
import React, { useState } from 'react';
import * as ICONS from 'constants/icons';
import * as CS from 'constants/claim_search';
import Button from '../button';
import classnames from 'classnames';
import { toCapitalCase } from '../../util/string';
import { FormField } from '../common/form-components/form-field';

type Props = {
  options: any,
  sortParam: string,
  timeParam: string,
  handleChange: any => void,
};

function DiscoverSearchOptions(props: Props) {
  const { sortParam, timeParam, handleChange, options } = props;

  const [expanded, setExpanded] = useState(false);

  return (
    <div className={'claim-search__wrapper'}>
      {CS.SEARCH_SORT.map(type => (
        <Button
          key={type}
          button="alt"
          onClick={e =>
            handleChange({
              key: CS.SORT_KEY,
              value: type,
            })
          }
          className={classnames(`button-toggle button-toggle--${type}`, {
            'button-toggle--active': sortParam === type,
          })}
          icon={toCapitalCase(type)}
          label={__(toCapitalCase(type))}
        />
      ))}
      <Button
        button={'alt'}
        aria-label={__('More')}
        className={classnames(`button-toggle button-toggle--top`, {
          'button-toggle--active': expanded,
        })}
        icon={toCapitalCase(ICONS.SETTINGS)}
        onClick={() => setExpanded(!expanded)}
      />
      {expanded && (
        <div className={classnames('card--inline', `claim-search__menus`)}>
          <div>
            {/* SEARCH TIMES */}
            {sortParam === CS.SORT_TOP && (
              <div className={'claim-search__input-container'}>
                <FormField
                  className="claim-search__dropdown"
                  type="select"
                  name="trending_time"
                  label={__('How Fresh')}
                  value={timeParam}
                  onChange={e =>
                    handleChange({
                      key: CS.TIME_KEY,
                      value: e.target.value,
                    })
                  }
                >
                  {CS.SEARCH_TIMES.map(time => (
                    <option key={time} value={time}>
                      {/* i18fixme */}
                      {time === CS.TIME_DAY && __('Today')}
                      {time !== CS.TIME_ALL &&
                        time !== CS.TIME_DAY &&
                        __('This ' + toCapitalCase(time)) /* yes, concat before i18n, since it is read from const */}
                      {time === CS.TIME_ALL && __('All time')}
                    </option>
                  ))}
                </FormField>
              </div>
            )}
            {/* FILE_TYPES */}
            {/* SDK ERRORS ON STREAM_TYPE CURRENTLY */}
            {/* {expanded && ( */}
            {/*  <div className={'claim-search__input-container'}> */}
            {/*  <FormField */}
            {/*    className="claim-search__dropdown" */}
            {/*    type="select" */}
            {/*    name="duration" */}
            {/*    value={options.stream_type || CS.FILE_ALL} */}
            {/*    onChange={e => handleChange( */}
            {/*      { */}
            {/*        key: CS.FILE_KEY, */}
            {/*        value: e.target.value, */}
            {/*      })} */}
            {/*  > */}
            {/*    {CS.FILE_TYPES.map(type => ( */}
            {/*      <option key={type} value={type}> */}
            {/*        /!* i18fixme *!/ */}
            {/*        {type === CS.FILE_VIDEO && __('Video')} */}
            {/*        {type === CS.FILE_AUDIO && __('Audio')} */}
            {/*        {type === CS.FILE_DOCUMENT && __('Document')} */}
            {/*        {type === CS.FILE_ALL && __('Any')} */}
            {/*      </option> */}
            {/*    ))} */}
            {/*  </FormField> */}
            {/*  </div> */}
            {/* )} */}

            {/* DURATIONS */}
            <div className={'claim-search__input-container'}>
              <FormField
                className="claim-search__dropdown"
                label={__('How Long')}
                type="select"
                name="file_type"
                value={options.duration || CS.DURATION_ALL}
                onChange={e =>
                  handleChange({
                    key: CS.DURATION_KEY,
                    value: e.target.value,
                  })
                }
              >
                {CS.DURATIONS.map(dur => (
                  <option key={dur} value={dur}>
                    {/* i18fixme */}
                    {dur === CS.DURATION_SHORT && __('Short')}
                    {dur === CS.DURATION_LONG && __('Long')}
                    {dur === CS.DURATION_ALL && __('Any')}
                  </option>
                ))}
              </FormField>
            </div>
          </div>
          {(options.duration || options.stream_type) && (
            <div className={'claim-search__input-container'}>
              <Button
                key={'clear'}
                button="alt"
                onClick={e =>
                  handleChange({
                    key: CS.CLEAR_KEY,
                    value: true,
                  })
                }
                label={__('Clear')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DiscoverSearchOptions;
