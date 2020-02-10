// @flow
import type { Node } from 'react';
import React, { Fragment, useEffect, useState } from 'react';
import { withRouter } from 'react-router';
import * as CS from 'constants/claim_search';
import { createNormalizedClaimSearchKey, MATURE_TAGS } from 'lbry-redux';
import Button from 'component/button';
import moment from 'moment';
import ClaimList from 'component/claimList';
import ClaimPreview from 'component/claimPreview';
import I18nMessage from 'component/i18nMessage';
import DiscoverSearchOptions from 'component/discoverSearchOptions';

type Props = {
  uris: Array<string>,
  subscribedChannels: Array<Subscription>,
  doClaimSearch: ({}) => void,
  tags: Array<string>,
  loading: boolean,
  personalView: boolean,
  doToggleTagFollow: string => void,
  meta?: Node,
  showNsfw: boolean,
  history: { action: string, push: string => void, replace: string => void },
  location: { search: string, pathname: string },
  claimSearchByQuery: {
    [string]: Array<string>,
  },
  hiddenUris: Array<string>,
  hiddenNsfwMessage?: Node,
  channelIds?: Array<string>,
  defaultTypeSort?: string,
  headerLabel?: string | Node,
};

function ClaimListDiscover(props: Props) {
  const {
    doClaimSearch,
    claimSearchByQuery,
    tags,
    loading,
    personalView,
    meta,
    channelIds,
    showNsfw,
    history,
    location,
    hiddenUris,
    hiddenNsfwMessage,
    defaultTypeSort,
    headerLabel,
  } = props;
  const didNavigateForward = history.action === 'PUSH';
  const [page, setPage] = useState(1);
  const { search } = location;
  const [forceRefresh, setForceRefresh] = useState();
  const urlParams = new URLSearchParams(search);
  const tagsInUrl = urlParams.get('t') || '';
  // custom params:
  const sortParam = urlParams.get('sort') || defaultTypeSort || CS.SORT_TRENDING;
  const timeParam = urlParams.get('time') || CS.TIME_WEEK;
  const durationParam = urlParams.get('d') || '';
  const streamTypeParam = urlParams.get('f') || '';

  const options: {
    page_size: number,
    page: number,
    no_totals: boolean,
    any_tags: Array<string>,
    channel_ids: Array<string>,
    not_channel_ids: Array<string>,
    not_tags: Array<string>,
    order_by: Array<string>,
    release_time?: string,
    duration?: string,
    stream_type?: string,
  } = {
    page_size: CS.PAGE_SIZE,
    page,
    // no_totals makes it so the sdk doesn't have to calculate total number pages for pagination
    // it's faster, but we will need to remove it if we start using total_pages
    no_totals: true,
    any_tags: tags || [],
    channel_ids: channelIds || [],
    not_channel_ids:
      // If channelIds were passed in, we don't need not_channel_ids
      !channelIds && hiddenUris && hiddenUris.length ? hiddenUris.map(hiddenUri => hiddenUri.split('#')[1]) : [],
    not_tags: !showNsfw ? MATURE_TAGS : [],
    order_by:
      sortParam === CS.SORT_TRENDING
        ? ['trending_group', 'trending_mixed']
        : sortParam === CS.SORT_NEW
        ? ['release_time']
        : ['effective_amount'], // Sort by top
  };

  if (sortParam === CS.SORT_TOP && timeParam !== CS.TIME_ALL) {
    options.release_time = `>${Math.floor(
      moment()
        .subtract(1, timeParam)
        .startOf('hour')
        .unix()
    )}`;
  } else if (sortParam === CS.SORT_NEW || sortParam === CS.SORT_TRENDING) {
    // Warning - hack below
    // If users are following more than 10 channels or tags, limit results to stuff less than a year old
    // For more than 20, drop it down to 6 months
    // This helps with timeout issues for users that are following a ton of stuff
    // https://github.com/lbryio/lbry-sdk/issues/2420
    if (options.channel_ids.length > 20 || options.any_tags.length > 20) {
      options.release_time = `>${Math.floor(
        moment()
          .subtract(6, CS.TIME_MONTH)
          .startOf('week')
          .unix()
      )}`;
    } else if (options.channel_ids.length > 10 || options.any_tags.length > 10) {
      options.release_time = `>${Math.floor(
        moment()
          .subtract(1, CS.TIME_YEAR)
          .startOf('week')
          .unix()
      )}`;
    } else {
      // Hack for at least the New page until https://github.com/lbryio/lbry-sdk/issues/2591 is fixed
      options.release_time = `<${Math.floor(
        moment()
          .startOf('minute')
          .unix()
      )}`;
    }
  }

  if (durationParam) {
    if (durationParam === CS.DURATION_SHORT) {
      options.duration = '<=1800';
    } else if (durationParam === CS.DURATION_LONG) {
      options.duration = '>=1800';
    }
  }

  if (streamTypeParam && CS.FILE_TYPES.includes(streamTypeParam)) {
    if (streamTypeParam !== CS.FILE_ALL) {
      options.stream_type = streamTypeParam;
    }
  }

  const hasMatureTags = tags && tags.some(t => MATURE_TAGS.includes(t));
  const claimSearchCacheQuery = createNormalizedClaimSearchKey(options);
  const uris = claimSearchByQuery[claimSearchCacheQuery] || [];
  const shouldPerformSearch =
    uris.length === 0 ||
    didNavigateForward ||
    (!loading && uris.length < CS.PAGE_SIZE * page && uris.length % CS.PAGE_SIZE === 0);
  // Don't use the query from createNormalizedClaimSearchKey for the effect since that doesn't include page & release_time
  const optionsStringForEffect = JSON.stringify(options);

  const noResults = (
    <div>
      <p>
        <I18nMessage
          tokens={{
            again: (
              <Button
                button="link"
                label={__('Please try again in a few seconds.')}
                onClick={() => setForceRefresh(Date.now())}
              />
            ),
          }}
        >
          Sorry, your request timed out. %again%
        </I18nMessage>
      </p>
      <p>
        <I18nMessage
          tokens={{
            contact_support: <Button button="link" label={__('contact support')} href="https://lbry.com/faq/support" />,
          }}
        >
          If you continue to have issues, please %contact_support%.
        </I18nMessage>
      </p>
    </div>
  );

  function getSearch() {
    let search = `?`;
    if (!personalView) {
      search += `t=${tagsInUrl}&`;
    }

    return search;
  }

  function handleChange(ob) {
    const url = buildUrl(ob);
    setPage(1);
    history.push(url);
  }

  function buildUrl(ob) {
    let url = `${getSearch()}`;

    if (personalView) {
      url += ob.key === 'sort' ? `&sort=${ob.value}` : `&sort=${sortParam}`;
    } else {
      url += ob.key === 'sort' ? `sort=${ob.value}` : `sort=${sortParam}`;
    }

    if (timeParam || ob.key === CS.TIME_KEY) {
      // || top
      if (ob.value !== CS.TIME_ALL) {
        url += ob.key === 'time' ? `&time=${ob.value}` : `&time=${timeParam}`;
      }
    }
    if (ob.key !== CS.CLEAR_KEY) {
      if (streamTypeParam || ob.key === CS.FILE_KEY) {
        if (ob.value !== CS.FILE_ALL) {
          url += ob.key === 'streamType' ? `&f=${ob.value}` : `&f=${streamTypeParam}`;
        }
      }
      if (durationParam || ob.key === CS.DURATION_KEY) {
        if (ob.value !== CS.DURATION_ALL) {
          url += ob.key === 'duration' ? `&d=${ob.value}` : `&d=${durationParam}`;
        }
      }
    }
    return url;
  }

  function handleScrollBottom() {
    if (!loading) {
      setPage(page + 1);
    }
  }

  useEffect(() => {
    if (shouldPerformSearch) {
      const searchOptions = JSON.parse(optionsStringForEffect);
      doClaimSearch(searchOptions);
    }
  }, [doClaimSearch, shouldPerformSearch, optionsStringForEffect, forceRefresh]);

  const header = (
    <Fragment>
      <DiscoverSearchOptions
        options={options}
        sortParam={sortParam}
        timeParam={timeParam}
        handleChange={handleChange}
      />
      {hasMatureTags && hiddenNsfwMessage}
    </Fragment>
  );

  return (
    <React.Fragment>
      <ClaimList
        id={claimSearchCacheQuery}
        loading={loading}
        uris={uris}
        header={header}
        headerLabel={headerLabel}
        headerAltControls={meta}
        onScrollBottom={handleScrollBottom}
        page={page}
        pageSize={CS.PAGE_SIZE}
        empty={noResults}
      />

      <div className="card">
        {loading && new Array(CS.PAGE_SIZE).fill(1).map((x, i) => <ClaimPreview key={i} placeholder="loading" />)}
      </div>
    </React.Fragment>
  );
}

export default withRouter(ClaimListDiscover);
